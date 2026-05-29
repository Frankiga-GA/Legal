import { useEffect, useMemo, useState } from 'react';
import { Bot, Edit3, FileText, FolderOpen, Plus, Search, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../utils/supabase';
import { uploadDocumentToBackend } from '../services/documentBackendService';
import { getStoredDriveToken, isSupportedPromptFile, isSupportedTemplateFile, listDriveFiles, listDriveFolders, onDriveTokenMessage } from '../services/googleDriveService';
import { ensureDefaultOrganization } from '../services/organizationService';
import BotChat from './BotChat';

const ASSISTANTS_STORAGE_KEY = 'lusti-assistants';
const TEMPLATES_STORAGE_KEY = 'lusti-assistant-templates';
const FILE_TEMPLATES_STORAGE_KEY = 'lusti-file-templates';
const defaultTemplates = [
  { id: 'tpl-job-offer', name: 'Oferta de trabajo', category: 'RRHH', description: 'Plantilla para publicar vacantes.', prompt: 'Redacta una oferta de trabajo clara, atractiva y profesional.' },
  { id: 'tpl-formal-letter', name: 'Carta formal', category: 'Legal', description: 'Formato para comunicaciones formales.', prompt: 'Redacta una carta formal con tono profesional.' },
  { id: 'tpl-brief-report', name: 'Informe breve', category: 'Análisis', description: 'Resumen ejecutivo y directo.', prompt: 'Redacta un informe breve, ordenado y fácil de leer.' },
  { id: 'tpl-summary', name: 'Resumen ejecutivo', category: 'Dirección', description: 'Sintetiza hallazgos y conclusiones.', prompt: 'Resume la información en formato ejecutivo.' },
  { id: 'tpl-test-fill', name: 'Plantilla de prueba', category: 'Demo', description: 'Sirve para probar el relleno con variables.', prompt: 'Genera el siguiente texto: Nombre: {{nombre}}. DNI: {{dni}}. Cargo: {{cargo}}. Fecha: {{fecha}}.' },
];

const defaultAssistants = [
  { id: 1, name: 'Experto Laboral', description: 'Especializado en disputas laborales, liquidaciones y beneficios sociales.', templates: ['tpl-brief-report', 'tpl-formal-letter'], documents: 12 },
  { id: 2, name: 'Contratos Civiles', description: 'Análisis de arrendamientos, compraventas y fianzas.', templates: ['tpl-formal-letter'], documents: 8 },
];

const defaultFileTemplates = [
  {
    id: 'file-tpl-1',
    name: 'Conocimiento de embarque',
    category: 'Logística',
    description: 'Formato base para documentos de embarque.',
    fileName: 'conocimiento-de-embarque.docx',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 0,
    fileDataUrl: '',
    updatedAt: new Date().toISOString(),
  },
];

const aiUseCases = [
  { title: 'Resume esta demanda', text: 'Convierte escritos largos en hechos, pretensiones, pruebas y riesgos.' },
  { title: 'Detecta riesgos laborales', text: 'Ubica contingencias, documentos faltantes y puntos vulnerables.' },
  { title: 'Genera carta notarial', text: 'Prepara un borrador con tono firme y datos pendientes claros.' },
  { title: 'Completa esta plantilla', text: 'Usa variables y campos del formato para producir una version editable.' },
  { title: 'Extrae datos clave del PDF', text: 'Identifica partes, fechas, montos, obligaciones y vencimientos.' },
];

const normalizeTemplate = (template) => ({
  id: template.id,
  name: template.name || 'Plantilla sin nombre',
  category: template.category || 'General',
  description: template.description || '',
  prompt: template.prompt || '',
});

const normalizeAssistant = (assistant) => ({
  id: assistant.id,
  name: assistant.name || 'Asistente sin nombre',
  description: assistant.description || 'Asistente general',
  templates: Array.isArray(assistant.templates) ? assistant.templates : [],
  promptFolderId: assistant.promptFolderId || '',
  templateFolderId: assistant.templateFolderId || '',
  driveFolderId: assistant.driveFolderId || '',
  selectedPromptFileIds: Array.isArray(assistant.selectedPromptFileIds) ? assistant.selectedPromptFileIds : [],
  documents: Number(assistant.documents || 0),
});

const normalizeFileTemplate = (template) => ({
  id: template.id,
  name: template.name || 'Formato sin nombre',
  category: template.category || 'General',
  description: template.description || '',
  fileName: template.fileName || '',
  fileType: template.fileType || '',
  fileSize: Number(template.fileSize || 0),
  fileDataUrl: template.fileDataUrl || '',
  fileText: template.fileText || '',
  updatedAt: template.updatedAt || new Date().toISOString(),
});

const readLocal = (key, fallback) => {
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const getLocalAssistants = () => readLocal(ASSISTANTS_STORAGE_KEY, defaultAssistants).map(normalizeAssistant);
const getLocalTemplates = () => readLocal(TEMPLATES_STORAGE_KEY, defaultTemplates).map(normalizeTemplate);
const getLocalFileTemplates = () => readLocal(FILE_TEMPLATES_STORAGE_KEY, defaultFileTemplates).map(normalizeFileTemplate);

const applyLocalFallbackData = (setAssistants, setTemplates, setFileTemplates) => {
  const localAssistants = getLocalAssistants();
  const localTemplates = getLocalTemplates();
  const localFileTemplates = getLocalFileTemplates();

  setAssistants(localAssistants.length ? localAssistants : defaultAssistants);
  setTemplates(localTemplates.length ? localTemplates : defaultTemplates);
  setFileTemplates(localFileTemplates.length ? localFileTemplates : defaultFileTemplates);

  return { localAssistants, localTemplates, localFileTemplates };
};

const writeLocal = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const ManagerBot = () => {
  const [activeView, setActiveView] = useState('assistants');
  const [assistants, setAssistants] = useState(defaultAssistants);
  const [templates, setTemplates] = useState(defaultTemplates);
  const [fileTemplates, setFileTemplates] = useState(defaultFileTemplates);
  const [search, setSearch] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [fileTemplateSearch, setFileTemplateSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingFileTemplate, setIsUploadingFileTemplate] = useState(false);
  const [editingAssistantId, setEditingAssistantId] = useState(null);
  const [activeBot, setActiveBot] = useState(null);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [driveFolders, setDriveFolders] = useState([]);
  const [driveFiles, setDriveFiles] = useState([]);
  const [isLoadingDriveFolders, setIsLoadingDriveFolders] = useState(false);
  const [hasHydratedData, setHasHydratedData] = useState(false);
  const [assistantSaveStatus, setAssistantSaveStatus] = useState('');
  const [newAssistant, setNewAssistant] = useState({ name: '', description: '', templates: [], selectedPromptFileIds: [], promptFolderId: '', templateFolderId: '', driveFolderId: '' });
  const [newTemplate, setNewTemplate] = useState({ name: '', category: 'General', description: '', prompt: '' });
  const [newFileTemplate, setNewFileTemplate] = useState({ name: '', category: 'General', description: '', file: null });

  useEffect(() => {
    applyLocalFallbackData(setAssistants, setTemplates, setFileTemplates);
    setHasHydratedData(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadDriveFolders = async () => {
      const token = getStoredDriveToken();
      if (!token) {
        setDriveFolders([]);
        setDriveFiles([]);
        return;
      }

      setIsLoadingDriveFolders(true);
      try {
        const [folders, files] = await Promise.all([listDriveFolders(token), listDriveFiles(token)]);
        if (!cancelled) {
          setDriveFolders(folders);
          setDriveFiles(files);
        }
      } catch {
        if (!cancelled) {
          setDriveFolders([]);
          setDriveFiles([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDriveFolders(false);
        }
      }
    };

    loadDriveFolders();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onDriveTokenMessage(() => {
      const reloadDrive = async () => {
        const token = getStoredDriveToken();
        if (!token) return;

        try {
          const [folders, files] = await Promise.all([listDriveFolders(token), listDriveFiles(token)]);
          setDriveFolders(folders);
          setDriveFiles(files);
        } catch (error) {
          console.warn('No se pudo actualizar Drive tras la conexion.', error);
        }
      };

      reloadDrive();
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const refreshDrive = async () => {
      const token = getStoredDriveToken();
      if (!token) return;

      try {
        const [folders, files] = await Promise.all([listDriveFolders(token), listDriveFiles(token)]);
        setDriveFolders(folders);
        setDriveFiles(files);
      } catch (error) {
        console.warn('No se pudo refrescar Drive automaticamente.', error);
      }
    };

    const intervalId = window.setInterval(refreshDrive, 60000);
    const onFocus = () => refreshDrive();

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  useEffect(() => {
    if (hasHydratedData) {
      writeLocal(ASSISTANTS_STORAGE_KEY, assistants);
    }
  }, [assistants, hasHydratedData]);

  useEffect(() => {
    if (hasHydratedData) {
      writeLocal(TEMPLATES_STORAGE_KEY, templates);
    }
  }, [templates, hasHydratedData]);

  useEffect(() => {
    if (hasHydratedData) {
      writeLocal(FILE_TEMPLATES_STORAGE_KEY, fileTemplates);
    }
  }, [fileTemplates, hasHydratedData]);

  const filteredAssistants = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return assistants;
    return assistants.filter((assistant) => {
      const templateNames = assistant.templates
        .map((templateId) => templates.find((template) => template.id === templateId)?.name || '')
        .join(' ');
      return [assistant.name, assistant.description, templateNames].join(' ').toLowerCase().includes(term);
    });
  }, [assistants, templates, search]);

  const filteredTemplates = useMemo(() => {
    const term = templateSearch.trim().toLowerCase();
    if (!term) return templates;
    return templates.filter((template) =>
      [template.name, template.category, template.description].join(' ').toLowerCase().includes(term)
    );
  }, [templates, templateSearch]);

  const filteredFileTemplates = useMemo(() => {
    const term = fileTemplateSearch.trim().toLowerCase();
    if (!term) return fileTemplates;
    return fileTemplates.filter((template) =>
      [template.name, template.category, template.description, template.fileName].join(' ').toLowerCase().includes(term)
    );
  }, [fileTemplates, fileTemplateSearch]);

  const persistAssistant = async (nextAssistants) => {
    setAssistants(nextAssistants);
    writeLocal(ASSISTANTS_STORAGE_KEY, nextAssistants);
  };

  const syncAssistantToSupabase = async (assistant) => {
    if (!isSupabaseConfigured || !supabase) return null;

    const { organizationId, user } = await ensureDefaultOrganization();
    if (!user || !organizationId) return null;

    const isTempId = String(assistant.id || '').startsWith('assistant-');
    const payload = {
      organization_id: organizationId,
      created_by: user.id,
      name: assistant.name,
      description: assistant.description,
      prompt_folder_id: assistant.promptFolderId || null,
      template_folder_id: assistant.templateFolderId || null,
      drive_folder_id: assistant.driveFolderId || null,
      templates: assistant.templates,
      selected_prompt_file_ids: assistant.selectedPromptFileIds || [],
      documents_count: Number(assistant.documents || 0),
      updated_at: new Date().toISOString(),
    };

    if (isTempId) {
      const { data, error } = await supabase
        .from('assistants')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return {
        ...assistant,
        id: data.id,
        promptFolderId: data.prompt_folder_id || '',
        templateFolderId: data.template_folder_id || '',
        driveFolderId: data.drive_folder_id || '',
        documents: Number(data.documents_count || 0),
      };
    }

    const { data, error } = await supabase
      .from('assistants')
      .update(payload)
      .eq('id', assistant.id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      templates: Array.isArray(data.templates) ? data.templates : [],
      selectedPromptFileIds: Array.isArray(data.selected_prompt_file_ids) ? data.selected_prompt_file_ids : [],
      promptFolderId: data.prompt_folder_id || '',
      templateFolderId: data.template_folder_id || '',
      driveFolderId: data.drive_folder_id || '',
      documents: Number(data.documents_count || 0),
    };
  };

  const persistTemplate = async (nextTemplates) => {
    setTemplates(nextTemplates);

    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    try {
      const { organizationId, user } = await ensureDefaultOrganization();
      if (!user || !organizationId) return;

      const nextState = [];

      for (const template of nextTemplates) {
        const isTempId = String(template.id || '').startsWith('tpl-');
        if (isTempId) {
          const { data, error } = await supabase
            .from('assistant_templates')
            .insert({
              name: template.name,
              organization_id: organizationId,
              created_by: user.id,
              category: template.category,
              description: template.description,
              prompt: template.prompt,
            })
            .select()
            .single();

          if (error) throw error;
          nextState.push({
            id: data.id,
            name: data.name,
            category: data.category || 'General',
            description: data.description || '',
            prompt: data.prompt || '',
          });
          continue;
        }

        const { data, error } = await supabase
          .from('assistant_templates')
          .update({
            name: template.name,
            category: template.category,
            description: template.description,
            prompt: template.prompt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', template.id)
          .eq('organization_id', organizationId)
          .select()
          .single();

        if (error) throw error;
        nextState.push({
          id: data.id,
          name: data.name,
          category: data.category || 'General',
          description: data.description || '',
          prompt: data.prompt || '',
        });
      }

      setTemplates(nextState);
    } catch (error) {
      console.warn('No se pudo guardar plantillas de prompt en Supabase, usando localStorage.', error);
    }
  };

  const persistFileTemplate = async (nextTemplates) => {
    setFileTemplates(nextTemplates);

    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    try {
      const { organizationId, user } = await ensureDefaultOrganization();
      if (!user || !organizationId) return;

      const nextState = [];

      for (const template of nextTemplates) {
        const isTempId = String(template.id || '').startsWith('file-tpl-');
        if (isTempId) {
          const { data, error } = await supabase
            .from('file_templates')
            .insert({
              organization_id: organizationId,
              created_by: user.id,
              name: template.name,
              category: template.category,
              description: template.description,
              file_name: template.fileName,
              file_type: template.fileType,
              file_size: template.fileSize,
              source_url: template.fileDataUrl,
              storage_path: null,
            })
            .select()
            .single();

          if (error) throw error;
          nextState.push({
            id: data.id,
            name: data.name,
            category: data.category || 'General',
            description: data.description || '',
            fileName: data.file_name,
            fileType: data.file_type || '',
            fileSize: Number(data.file_size || 0),
            fileDataUrl: data.source_url || '',
            updatedAt: data.updated_at,
          });
          continue;
        }

        const { data, error } = await supabase
          .from('file_templates')
          .update({
            name: template.name,
            category: template.category,
            description: template.description,
            file_name: template.fileName,
            file_type: template.fileType,
            file_size: template.fileSize,
            source_url: template.fileDataUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', template.id)
          .eq('organization_id', organizationId)
          .select()
          .single();

        if (error) throw error;
        nextState.push({
          id: data.id,
          name: data.name,
          category: data.category || 'General',
          description: data.description || '',
          fileName: data.file_name,
          fileType: data.file_type || '',
          fileSize: Number(data.file_size || 0),
          fileDataUrl: data.source_url || '',
          updatedAt: data.updated_at,
        });
      }

      setFileTemplates(nextState);
    } catch (error) {
      console.warn('No se pudo guardar formatos en Supabase, usando localStorage.', error);
    }
  };

  const resetAssistantForm = () => {
    setNewAssistant({ name: '', description: '', templates: [], selectedPromptFileIds: [], promptFolderId: '', templateFolderId: '', driveFolderId: '' });
    setEditingAssistantId(null);
    setIsCreating(false);
  };

  const handleSaveAssistant = async (e) => {
    e.preventDefault();
    if (!newAssistant.name.trim()) return;
    setAssistantSaveStatus('guardando');

    const payload = {
      id: editingAssistantId || `assistant-${Date.now()}`,
      name: newAssistant.name.trim(),
      description: newAssistant.description.trim() || 'Asistente general',
      templates: newAssistant.templates,
      selectedPromptFileIds: newAssistant.selectedPromptFileIds || [],
      promptFolderId: newAssistant.promptFolderId || '',
      templateFolderId: newAssistant.templateFolderId || '',
      driveFolderId: newAssistant.driveFolderId || '',
      documents: 0,
    };

    try {
      const nextAssistants = editingAssistantId
        ? assistants.map((assistant) => (assistant.id === editingAssistantId ? payload : assistant))
        : [payload, ...assistants];

      await persistAssistant(nextAssistants);

      let syncedAssistant = null;
      try {
        syncedAssistant = await syncAssistantToSupabase(payload);
      } catch (syncError) {
        console.warn('Asistente guardado localmente, pero Supabase no acepto la sincronizacion.', syncError);
      }

      if (syncedAssistant) {
        const resolvedAssistants = nextAssistants.map((assistant) =>
          assistant.id === payload.id ? syncedAssistant : assistant
        );
        await persistAssistant(resolvedAssistants);
        setAssistantSaveStatus('guardado');
      } else {
        setAssistantSaveStatus('guardado localmente');
      }
      resetAssistantForm();
    } catch (error) {
      console.warn('No se pudo guardar el asistente.', error);
      setAssistantSaveStatus('error');
      alert(`No se pudo guardar el asistente: ${error?.message || 'Error desconocido'}`);
    }
  };

  const handleEditAssistant = (assistant) => {
    setEditingAssistantId(assistant.id);
    setNewAssistant({
      name: assistant.name,
      description: assistant.description,
      templates: assistant.templates || [],
      selectedPromptFileIds: assistant.selectedPromptFileIds || [],
      promptFolderId: assistant.promptFolderId || '',
      templateFolderId: assistant.templateFolderId || '',
      driveFolderId: assistant.driveFolderId || '',
    });
    setIsCreating(true);
  };

  const togglePromptFileForAssistant = (fileId) => {
    setNewAssistant((current) => {
      const currentIds = Array.isArray(current.selectedPromptFileIds) ? current.selectedPromptFileIds : [];
      const nextIds = currentIds.includes(fileId)
        ? currentIds.filter((id) => id !== fileId)
        : [...currentIds, fileId];

      return { ...current, selectedPromptFileIds: nextIds };
    });
  };

  const deleteAssistant = async (id) => {
    if (isSupabaseConfigured && supabase && !String(id || '').startsWith('assistant-')) {
      const { organizationId } = await ensureDefaultOrganization();
      if (organizationId) {
        const { error } = await supabase.from('assistants').delete().eq('id', id).eq('organization_id', organizationId);
        if (error) console.warn('No se pudo borrar el asistente en Supabase.', error);
      }
    }

    await persistAssistant(assistants.filter((assistant) => assistant.id !== id));
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplate.name.trim()) return;

    const nextTemplate = {
      id: `tpl-${Date.now()}`,
      name: newTemplate.name.trim(),
      category: newTemplate.category.trim() || 'General',
      description: newTemplate.description.trim(),
      prompt: newTemplate.prompt.trim(),
    };

    await persistTemplate([nextTemplate, ...templates]);
    setNewTemplate({ name: '', category: 'General', description: '', prompt: '' });
  };

  const handleSaveFileTemplate = async (e) => {
    e.preventDefault();
    if (!newFileTemplate.name.trim() || !newFileTemplate.file) return;

    const isTextLike = /(\.txt|\.md)$/i.test(newFileTemplate.file.name) || /^text\/|^application\/json$/.test(newFileTemplate.file.type);
    const [fileDataUrl, fileText] = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (isTextLike) {
          resolve(['', String(reader.result || '')]);
        } else {
          resolve([String(reader.result || ''), '']);
        }
      };
      reader.onerror = () => reject(reader.error);
      if (isTextLike) {
        reader.readAsText(newFileTemplate.file, 'utf-8');
      } else {
        reader.readAsDataURL(newFileTemplate.file);
      }
    });

    let resolvedFileText = String(fileText || '').trim();
    if (!resolvedFileText && !isTextLike) {
      try {
        const backendResponse = await uploadDocumentToBackend(newFileTemplate.file);
        resolvedFileText = String(backendResponse?.extracted_text || '').trim();
      } catch (error) {
        console.warn('No se pudo extraer texto del formato al guardarlo. Se guardara solo como archivo.', error);
      }
    }

    const nextFileTemplate = {
      id: `file-tpl-${Date.now()}`,
      name: newFileTemplate.name.trim(),
      category: newFileTemplate.category.trim() || 'General',
      description: newFileTemplate.description.trim(),
      fileName: newFileTemplate.file.name,
      fileType: newFileTemplate.file.type,
      fileSize: newFileTemplate.file.size,
      fileDataUrl,
      fileText: resolvedFileText,
      updatedAt: new Date().toISOString(),
    };

    await persistFileTemplate([nextFileTemplate, ...fileTemplates]);
    setNewFileTemplate({ name: '', category: 'General', description: '', file: null });
    setIsUploadingFileTemplate(false);
  };

  const toggleTemplateForAssistant = (templateId) => {
    setNewAssistant((current) => {
      const selected = current.templates.includes(templateId)
        ? current.templates.filter((id) => id !== templateId)
        : [...current.templates, templateId];
      return { ...current, templates: selected };
    });
  };

  const deleteTemplate = async (templateId) => {
    if (isSupabaseConfigured && supabase && !String(templateId || '').startsWith('tpl-')) {
      const { organizationId } = await ensureDefaultOrganization();
      if (organizationId) {
        const { error } = await supabase.from('assistant_templates').delete().eq('id', templateId).eq('organization_id', organizationId);
        if (error) console.warn('No se pudo borrar la plantilla en Supabase.', error);
      }
    }

    const nextTemplates = templates.filter((template) => template.id !== templateId);
    const nextAssistants = assistants.map((assistant) => ({
      ...assistant,
      templates: assistant.templates.filter((id) => id !== templateId),
    }));

    await persistTemplate(nextTemplates);
    await persistAssistant(nextAssistants);
  };

  const saveGeneratedDocument = async ({ title, content, selectedTemplate, selectedFileTemplate, shareUrl }) => {
    if (!content?.trim() || !isSupabaseConfigured || !supabase) {
      return { saved: false };
    }

    const { organizationId, user } = await ensureDefaultOrganization();
    if (!user || !organizationId) return { saved: false };

    const assistantId = String(activeBot?.id || '').startsWith('assistant-') ? null : activeBot?.id || null;
    const fileTemplateId = String(selectedFileTemplate?.id || '').startsWith('file-tpl-') ? null : selectedFileTemplate?.id || null;

    const { error } = await supabase.from('generated_documents').insert({
      organization_id: organizationId,
      created_by: user.id,
      assistant_id: assistantId,
      file_template_id: fileTemplateId,
      title: title || selectedTemplate?.name || selectedFileTemplate?.name || 'Documento generado',
      content,
      format: 'txt',
      share_url: shareUrl || null,
      status: 'draft',
    });

    if (error) throw error;

    if (assistantId) {
      const nextAssistants = assistants.map((assistant) =>
        assistant.id === assistantId
          ? { ...assistant, documents: Number(assistant.documents || 0) + 1 }
          : assistant
      );
      await persistAssistant(nextAssistants);
    }

    return { saved: true };
  };

  const deleteFileTemplate = async (templateId) => {
    if (isSupabaseConfigured && supabase && !String(templateId || '').startsWith('file-tpl-')) {
      const { organizationId } = await ensureDefaultOrganization();
      if (organizationId) {
        const { error } = await supabase.from('file_templates').delete().eq('id', templateId).eq('organization_id', organizationId);
        if (error) console.warn('No se pudo borrar el formato en Supabase.', error);
      }
    }

    await persistFileTemplate(fileTemplates.filter((template) => template.id !== templateId));
  };

  const downloadFileTemplate = (template) => {
    if (!template.fileDataUrl) return;
    const a = document.createElement('a');
    a.href = template.fileDataUrl;
    a.download = template.fileName || `${template.name}.bin`;
    a.click();
  };

  const openAssistant = (assistant) => {
    const assistantTemplates = templates.filter((template) => assistant.templates.includes(template.id));
    const driveFolder = driveFolders.find((folder) => folder.id === assistant.driveFolderId) || null;
    const promptFolder = driveFolders.find((folder) => folder.id === assistant.promptFolderId) || null;
    const templateFolder = driveFolders.find((folder) => folder.id === assistant.templateFolderId) || null;
    const selectedPromptFiles = assistant.selectedPromptFileIds?.length
      ? driveFiles.filter((file) => assistant.selectedPromptFileIds.includes(file.id))
      : [];
    const templateFiles = driveFiles.filter((file) => {
      if (!templateFolder?.id) return true;
      return Array.isArray(file.parents) && file.parents.includes(templateFolder.id) && isSupportedTemplateFile(file);
    });
    const promptFiles = driveFiles.filter((file) => {
      if (!promptFolder?.id) return true;
      return Array.isArray(file.parents) && file.parents.includes(promptFolder.id) && isSupportedPromptFile(file);
    });
    setActiveBot({
      id: assistant.id,
      name: assistant.name,
      description: assistant.description,
      templates: assistantTemplates,
      promptFiles,
      selectedPromptFiles,
      templateFiles,
      driveFolder,
      promptFolder,
      templateFolder,
      docs: assistant.documents || 0,
      allTemplates: templates,
      fileTemplates,
      promptContext: selectedPromptFiles.length
        ? selectedPromptFiles
            .map((file) => `${file.name}${file.modifiedTime ? ` | ${file.modifiedTime}` : ''}`)
            .join('\n')
        : promptFiles.length
          ? promptFiles
              .map((file) => `${file.name}${file.modifiedTime ? ` | ${file.modifiedTime}` : ''}`)
              .join('\n')
          : '',
    });
  };

  if (activeBot) {
    return (
      <BotChat
        bot={activeBot}
        onBack={() => setActiveBot(null)}
        onSaveGeneratedDocument={saveGeneratedDocument}
      />
    );
  };

  return (
    <div className="relative min-h-screen bg-brand-black p-8 md:p-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.06]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-6 border-b border-white/[0.05] pb-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
              <span className="text-[11px] font-semibold text-brand-gold">Preguntar o generar con IA</span>
            </div>
            <h2 className="flex items-center gap-4 text-5xl font-serif font-medium tracking-tight text-brand-ivory">IA legal</h2>
            <p className="text-sm font-light tracking-wide text-brand-accent/40">
              Tercer flujo de LUSTI: consulta asistentes, usa prompts y genera documentos desde plantillas reales.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActiveView('assistants')}
              className={`rounded-lg border px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-all ${activeView === 'assistants' ? 'border-brand-gold bg-brand-gold text-brand-black' : 'border-white/[0.08] bg-white/[0.02] text-brand-ivory hover:border-brand-gold/30'}`}
            >
              Asistentes
            </button>
            <button
              type="button"
              onClick={() => setActiveView('templates')}
              className={`rounded-lg border px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-all ${activeView === 'templates' ? 'border-brand-gold bg-brand-gold text-brand-black' : 'border-white/[0.08] bg-white/[0.02] text-brand-ivory hover:border-brand-gold/30'}`}
            >
              Plantillas
            </button>
            <button
              type="button"
              onClick={() => setActiveView('file-templates')}
              className={`rounded-lg border px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-all ${activeView === 'file-templates' ? 'border-brand-gold bg-brand-gold text-brand-black' : 'border-white/[0.08] bg-white/[0.02] text-brand-ivory hover:border-brand-gold/30'}`}
            >
              Formatos
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-3 rounded-lg bg-brand-gold px-6 py-3 font-bold tracking-tight text-brand-black transition-colors hover:bg-white"
            >
              <Plus className="h-5 w-5" />
              Crear asistente
            </button>
          </div>
        </header>

        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full max-w-xl items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
            <Search className="h-4 w-4 text-brand-accent/30" />
            <input
              value={activeView === 'assistants' ? search : activeView === 'templates' ? templateSearch : fileTemplateSearch}
              onChange={(e) => {
                if (activeView === 'assistants') setSearch(e.target.value);
                if (activeView === 'templates') setTemplateSearch(e.target.value);
                if (activeView === 'file-templates') setFileTemplateSearch(e.target.value);
              }}
              placeholder={
                activeView === 'assistants'
                  ? 'Buscar asistentes o prompts asignados...'
                  : activeView === 'templates'
                    ? 'Buscar plantillas de prompt...'
                    : 'Buscar formatos de archivo...'
              }
              className="w-full bg-transparent text-sm text-brand-ivory outline-none placeholder:text-brand-accent/20"
            />
          </div>

          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-brand-accent/35">
            <span>{assistants.length} asistentes</span>
            <span>•</span>
            <span>{templates.length} plantillas</span>
            <span>•</span>
            <span>{fileTemplates.length} formatos</span>
          <span>•</span>
            <span>{isLoadingRemote ? 'Sincronizando' : isSupabaseConfigured ? 'Supabase listo' : 'Guardado localmente'}</span>
          </div>
        </div>

        <section className="mb-8 rounded-lg border border-white/[0.06] bg-white/[0.015] p-5">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-xl font-serif text-brand-ivory">Casos de uso que venden la IA</h3>
              <p className="mt-1 text-sm text-brand-accent/45">
                Muestra tareas legales concretas antes de abrir el chat.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('file-templates')}
              className="text-sm font-semibold text-brand-gold transition-colors hover:text-brand-ivory"
            >
              Ver formatos reales
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {aiUseCases.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setSearch(item.title)}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-colors hover:border-brand-gold/30 hover:bg-white/[0.035]"
              >
                <p className="text-sm font-semibold text-brand-ivory">{item.title}</p>
                <p className="mt-2 text-xs leading-5 text-brand-accent/45">{item.text}</p>
              </button>
            ))}
          </div>
        </section>

        {activeView === 'assistants' ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAssistants.map((assistant) => {
              return (
                <button
                  key={assistant.id}
                  type="button"
                  onClick={() => openAssistant(assistant)}
                  className="glass-card group relative flex h-full flex-col rounded-lg border border-white/[0.05] bg-white/[0.01] p-8 text-left transition-colors hover:border-brand-gold/30 hover:bg-white/[0.02]"
                >
                  <div className="mb-8 flex items-start justify-between">
                    <div className="rounded-lg bg-brand-gold/10 p-4 text-brand-gold transition-all">
                      <Bot className="h-6 w-6" />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAssistant(assistant.id);
                      }}
                      className="text-brand-accent/20 transition-colors hover:text-red-500/60"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <h3 className="mb-3 text-2xl font-serif font-medium text-brand-ivory transition-colors group-hover:text-brand-gold">{assistant.name}</h3>
                  <p className="mb-6 flex-1 text-sm font-light leading-relaxed text-brand-accent/40">{assistant.description}</p>

                  <div className="mb-6 flex flex-wrap gap-2">
                    {assistant.promptFolderId ? (
                      <span className="rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-brand-gold">
                        Prompts
                      </span>
                    ) : null}
                    {assistant.templateFolderId ? (
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-brand-ivory/70">
                        Plantillas
                      </span>
                    ) : null}
                    {assistant.driveFolderId ? (
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-brand-ivory/70">
                        Drive
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between border-t border-white/[0.05] pt-6">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-gold font-bold">
                      <FolderOpen className="h-3 w-3" />
                      {assistant.documents} documentos
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAssistant(assistant);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-brand-ivory transition-all hover:border-brand-gold/30"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Editar
                      </button>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : activeView === 'templates' ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="rounded-lg border border-white/[0.05] bg-white/[0.01] p-6">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-serif font-medium text-brand-ivory">{template.name}</h3>
                      <p className="text-[10px] uppercase tracking-widest text-brand-gold">{template.category}</p>
                    </div>
                    <button onClick={() => deleteTemplate(template.id)} className="text-brand-accent/20 transition-colors hover:text-red-500/60">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mb-4 text-sm font-light leading-relaxed text-brand-accent/40">{template.description}</p>
                  <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-4 text-xs text-brand-ivory/60">{template.prompt}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSaveTemplate} className="rounded-lg border border-white/[0.05] bg-white/[0.01] p-6">
              <h3 className="mb-4 text-2xl font-serif font-medium text-brand-ivory">Nueva plantilla</h3>
              <div className="space-y-4">
                <input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Nombre de la plantilla"
                  className="w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none placeholder:text-brand-accent/20"
                />
                <input
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                  placeholder="Categoría"
                  className="w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none placeholder:text-brand-accent/20"
                />
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Descripción breve"
                  className="h-24 w-full resize-none rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none placeholder:text-brand-accent/20"
                />
                <textarea
                  value={newTemplate.prompt}
                  onChange={(e) => setNewTemplate({ ...newTemplate, prompt: e.target.value })}
                  placeholder="Instrucción base de la plantilla"
                  className="h-28 w-full resize-none rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none placeholder:text-brand-accent/20"
                />
                <button type="submit" className="w-full rounded-lg bg-brand-gold px-4 py-3 font-bold text-brand-black transition-all hover:bg-white">
                  Guardar plantilla
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredFileTemplates.map((template) => (
                <div key={template.id} className="rounded-lg border border-white/[0.05] bg-white/[0.01] p-6">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-serif font-medium text-brand-ivory">{template.name}</h3>
                      <p className="text-[10px] uppercase tracking-widest text-brand-gold">{template.category}</p>
                    </div>
                    <button onClick={() => deleteFileTemplate(template.id)} className="text-brand-accent/20 transition-colors hover:text-red-500/60">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mb-4 text-sm font-light leading-relaxed text-brand-accent/40">{template.description}</p>
                  <div className="mb-4 rounded-lg border border-white/[0.05] bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-accent/35">
                      <FileText className="h-3.5 w-3.5" />
                      {template.fileName || 'Sin archivo'}
                    </div>
                    <div className="mt-2 text-xs text-brand-accent/30">
                      {template.fileSize ? `${Math.round(template.fileSize / 1024)} KB` : 'Archivo guardado'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadFileTemplate(template)}
                      className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-brand-ivory transition-all hover:border-brand-gold/30"
                    >
                      Descargar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <button
                onClick={() => setIsUploadingFileTemplate(true)}
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-brand-gold px-6 py-4 font-bold tracking-tight text-brand-black transition-all hover:bg-white"
              >
                <Upload className="h-5 w-5" />
                Subir formato
              </button>

              {isUploadingFileTemplate && (
                <form onSubmit={handleSaveFileTemplate} className="rounded-lg border border-white/[0.05] bg-white/[0.01] p-6">
                  <h3 className="mb-4 text-2xl font-serif font-medium text-brand-ivory">Nuevo formato</h3>
                  <div className="space-y-4">
                    <input
                      value={newFileTemplate.name}
                      onChange={(e) => setNewFileTemplate({ ...newFileTemplate, name: e.target.value })}
                      placeholder="Nombre del formato"
                      className="w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none placeholder:text-brand-accent/20"
                    />
                    <input
                      value={newFileTemplate.category}
                      onChange={(e) => setNewFileTemplate({ ...newFileTemplate, category: e.target.value })}
                      placeholder="Categoría"
                      className="w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none placeholder:text-brand-accent/20"
                    />
                    <textarea
                      value={newFileTemplate.description}
                      onChange={(e) => setNewFileTemplate({ ...newFileTemplate, description: e.target.value })}
                      placeholder="Descripción breve"
                      className="h-24 w-full resize-none rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none placeholder:text-brand-accent/20"
                    />
                    <label className="block">
                      <span className="mb-2 block text-[10px] uppercase tracking-widest text-brand-accent/60">Archivo Word, PDF o similar</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.xlsx"
                        onChange={(e) => setNewFileTemplate({ ...newFileTemplate, file: e.target.files?.[0] || null })}
                        className="w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory file:mr-4 file:rounded-lg file:border-0 file:bg-brand-gold file:px-4 file:py-2 file:text-sm file:font-bold file:text-brand-black"
                      />
                    </label>
                    <button type="submit" className="w-full rounded-lg bg-brand-ivory px-4 py-3 font-bold text-brand-black transition-all hover:bg-white">
                      Guardar formato
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUploadingFileTemplate(false)}
                      className="w-full rounded-lg border border-white/[0.08] px-4 py-3 font-bold tracking-tight text-brand-ivory transition-all hover:border-brand-gold/30"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brand-black/90 p-3 sm:p-4 lg:items-center">
            <div className="w-full max-w-5xl rounded-lg border border-white/[0.05] bg-brand-dark p-4 sm:p-5 lg:max-w-[72rem] lg:p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-serif font-medium text-brand-ivory sm:text-3xl">
                    {editingAssistantId ? 'Editar asistente' : 'Crear asistente legal'}
                  </h3>
                  <p className="mt-1 text-sm font-light text-brand-accent/40">
                    Selecciona las plantillas que este asistente podrá usar o recomendar.
                  </p>
                </div>
                <button onClick={resetAssistantForm} className="text-brand-accent/40 transition-colors hover:text-brand-ivory">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSaveAssistant} className="space-y-4 lg:space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/60">Nombre del asistente</label>
                  <input
                    type="text"
                    value={newAssistant.name}
                    onChange={(e) => setNewAssistant({ ...newAssistant, name: e.target.value })}
                    placeholder="Ej. Experto en ofertas de trabajo"
                    className="w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-brand-ivory outline-none transition-all placeholder:text-brand-accent/20"
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/60">Carpeta de prompts</label>
                    <select
                      value={newAssistant.promptFolderId || ''}
                      onChange={(e) => setNewAssistant({ ...newAssistant, promptFolderId: e.target.value })}
                      className="w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-brand-ivory outline-none transition-all focus:border-brand-gold/40"
                      disabled={isLoadingDriveFolders}
                    >
                      <option value="">Sin carpeta de prompts</option>
                      {driveFolders.map((folder) => (
                        <option key={folder.id} value={folder.id} className="bg-brand-dark">
                          {folder.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] uppercase tracking-widest text-brand-accent/35">
                      Esa carpeta alimenta el bloque de prompts del asistente.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/60">Carpeta de plantillas</label>
                    <select
                      value={newAssistant.templateFolderId || ''}
                      onChange={(e) => setNewAssistant({ ...newAssistant, templateFolderId: e.target.value })}
                      className="w-full rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-brand-ivory outline-none transition-all focus:border-brand-gold/40"
                      disabled={isLoadingDriveFolders}
                    >
                      <option value="">Sin carpeta de plantillas</option>
                      {driveFolders.map((folder) => (
                        <option key={folder.id} value={folder.id} className="bg-brand-dark">
                          {folder.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] uppercase tracking-widest text-brand-accent/35">
                      Esa carpeta alimenta las plantillas que verá el chat.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/60">Prompts IA</label>
                    <span className="text-[10px] uppercase tracking-widest text-brand-accent/35">
                      {(newAssistant.selectedPromptFileIds || []).length} seleccionados
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-3">
                    {newAssistant.promptFolderId && driveFiles.filter((file) => Array.isArray(file.parents) && file.parents.includes(newAssistant.promptFolderId) && isSupportedPromptFile(file)).length ? (
                      <div className="grid max-h-56 grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2">
                        {driveFiles
                          .filter((file) => Array.isArray(file.parents) && file.parents.includes(newAssistant.promptFolderId) && isSupportedPromptFile(file))
                          .map((file) => {
                            const isSelected = (newAssistant.selectedPromptFileIds || []).includes(file.id);
                            return (
                              <button
                                key={file.id}
                                type="button"
                                onClick={() => togglePromptFileForAssistant(file.id)}
                                className={`rounded-lg border p-3 text-left transition-all ${
                                  isSelected
                                    ? 'border-brand-gold bg-brand-gold/10'
                                    : 'border-white/[0.06] bg-white/[0.02] hover:border-brand-gold/30 hover:bg-white/[0.04]'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h4 className="text-sm font-semibold text-brand-ivory">{file.name}</h4>
                                    <p className="text-[10px] uppercase tracking-widest text-brand-gold">{file.mimeType || 'Drive'}</p>
                                  </div>
                                  <span className={`text-[10px] uppercase tracking-widest ${isSelected ? 'text-brand-gold' : 'text-brand-accent/35'}`}>
                                    {isSelected ? 'Asignado' : 'Agregar'}
                                  </span>
                                </div>
                                <p className="mt-3 text-xs font-light leading-relaxed text-brand-accent/40">{file.modifiedTime || 'Archivo de Drive'}</p>
                              </button>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-5 text-sm text-brand-accent/35">
                        Selecciona una carpeta de prompts para ver sus archivos.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/60">Especialidad y alcance</label>
                  <textarea
                    value={newAssistant.description}
                    onChange={(e) => setNewAssistant({ ...newAssistant, description: e.target.value })}
                    placeholder="Define para qué sirve este asistente y qué tipo de ayuda dará..."
                    className="h-24 w-full resize-none rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-brand-ivory outline-none transition-all placeholder:text-brand-accent/20 sm:h-28"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-accent/60">Documentos de referencia</label>
                  <div className="cursor-pointer rounded-xl border border-dashed border-white/[0.1] p-6 text-center transition-all hover:bg-white/[0.02] sm:p-8">
                    <Upload className="mx-auto mb-3 h-7 w-7 text-brand-accent/20 transition-colors" />
                    <p className="text-xs font-light text-brand-accent/40">Sube documentos PDF o DOCX para que el asistente los use como contexto</p>
                    <p className="mt-2 text-[10px] uppercase tracking-widest text-brand-accent/35">
                      Este bloque es opcional. Puedes dejarlo vacío si trabajas solo con Drive.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                  <button type="button" onClick={resetAssistantForm} className="flex-1 rounded-lg border border-white/[0.08] px-4 py-3 font-bold tracking-tight text-brand-ivory transition-all hover:border-brand-gold/30">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 rounded-lg bg-brand-ivory px-4 py-3 font-bold tracking-tight text-brand-black transition-all hover:bg-white">
                    Guardar asistente
                  </button>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-brand-accent/35">
                  {assistantSaveStatus === 'guardando' && 'Guardando asistente...'}
                  {assistantSaveStatus === 'guardado' && 'Asistente guardado localmente y sincronizado si la base lo permite.'}
                  {assistantSaveStatus === 'error' && 'No se pudo guardar. Revisa el mensaje de error.'}
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerBot;


