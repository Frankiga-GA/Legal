// src/components/CaseDetailDrawer.jsx
import { useState } from 'react';
import {
  Bot,
  Calendar,
  CheckCircle2,
  FileText,
  MessageSquare,
  Plus,
  Upload,
  User,
  X,
} from 'lucide-react';

const CaseDetailDrawer = ({ caseData, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [noteText, setNoteText] = useState('');
  const [deadlineForm, setDeadlineForm] = useState({
    title: '',
    date: '',
    priority: 'Media',
  });
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([
    {
      role: 'ai',
      content: 'Listo para revisar este expediente. Puedo resumir el caso, listar documentos, detectar vencimientos, sugerir proximos pasos o preparar un borrador breve.',
    },
  ]);

  if (!caseData) return null;

  const documents = Array.isArray(caseData.documents) ? caseData.documents : [];
  const notes = Array.isArray(caseData.notes) ? caseData.notes : [];
  const importantDates = Array.isArray(caseData.importantDates) ? caseData.importantDates : [];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const newDoc = {
      id: Date.now(),
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB',
      date: new Date().toISOString().split('T')[0],
      type: file.type,
    };

    onUpdate(caseData.id, {
      documents: [...documents, newDoc],
    });

    e.target.value = '';
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    const newNote = {
      id: Date.now(),
      text: noteText.trim(),
      author: 'Equipo legal',
      date: new Date().toISOString().split('T')[0],
    };

    onUpdate(caseData.id, {
      notes: [newNote, ...notes],
    });
    setNoteText('');
  };

  const handleAddDeadline = (e) => {
    e.preventDefault();
    if (!deadlineForm.title.trim() || !deadlineForm.date) return;

    const newDeadline = {
      id: Date.now(),
      title: deadlineForm.title.trim(),
      date: deadlineForm.date,
      priority: deadlineForm.priority,
      status: 'Pendiente',
    };

    onUpdate(caseData.id, {
      importantDates: [newDeadline, ...importantDates],
    });
    setDeadlineForm({ title: '', date: '', priority: 'Media' });
  };

  const handleAskAi = (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const question = aiInput.trim();
    const response = buildCaseResponse(question, caseData, documents, notes, importantDates);

    setAiMessages(prev => [
      ...prev,
      { role: 'user', content: question },
      { role: 'ai', content: response },
    ]);
    setAiInput('');
  };

  const tabs = [
    { id: 'summary', label: 'Resumen', icon: FileText },
    { id: 'documents', label: 'Documentos', icon: Upload },
    { id: 'dates', label: 'Fechas', icon: Calendar },
    { id: 'notes', label: 'Notas', icon: MessageSquare },
    { id: 'ai', label: 'IA', icon: Bot },
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-white/[0.06] bg-brand-dark shadow-2xl sm:w-[640px]">
      <div className="border-b border-white/[0.06] bg-white/[0.01] p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gold">
                {caseData.status}
              </span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent/60">
                {caseData.type}
              </span>
            </div>
            <h3 className="truncate text-3xl font-serif font-medium tracking-tight text-brand-ivory">{caseData.id}</h3>
            <p className="mt-2 text-sm text-brand-accent/60">{caseData.clientName}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-brand-accent/40 transition-colors hover:bg-white/[0.05] hover:text-brand-ivory">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <SummaryMetric label="Documentos" value={documents.length} />
          <SummaryMetric label="Fechas" value={importantDates.length} />
          <SummaryMetric label="Notas" value={notes.length} />
        </div>
      </div>

      <div className="border-b border-white/[0.06] bg-brand-black/20 px-6 py-3">
        <div className="grid grid-cols-5 gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] transition-all ${
                  isActive
                    ? 'bg-brand-ivory text-brand-black'
                    : 'text-brand-accent/45 hover:bg-white/[0.04] hover:text-brand-ivory'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoCard icon={User} label="Titular / cliente" value={caseData.clientName} />
              <InfoCard icon={Calendar} label="Ultima actualizacion" value={caseData.lastUpdate} />
            </section>

            <section className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-5">
              <h4 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent/50">
                <FileText className="h-4 w-4 text-brand-gold" />
                Resumen del caso
              </h4>
              <p className="text-sm font-light leading-7 text-brand-ivory/72">
                {caseData.summary || 'Aun no se ha registrado un resumen para este expediente.'}
              </p>
            </section>

            <section className="rounded-lg border border-brand-gold/15 bg-brand-gold/[0.04] p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-lg font-serif text-brand-ivory">Asistente del expediente</h4>
                  <p className="mt-1 text-xs text-brand-accent/50">Preparado para usar resumen, documentos, notas y fechas del caso.</p>
                </div>
                <Bot className="h-6 w-6 text-brand-gold" />
              </div>
              <button
                onClick={() => setActiveTab('ai')}
                className="inline-flex w-full items-center justify-between rounded-lg bg-brand-ivory px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-black transition-colors hover:bg-white"
              >
                Consultar IA sobre este expediente
                <MessageSquare className="h-4 w-4" />
              </button>
            </section>
          </div>
        )}

        {activeTab === 'documents' && (
          <section className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-serif text-brand-ivory">Documentos vinculados</h4>
                <p className="mt-1 text-xs text-brand-accent/45">Archivos que forman el contexto documental del expediente.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-ivory px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-black transition-colors hover:bg-white">
                <Upload className="h-4 w-4" />
                Subir
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="space-y-3">
              {documents.length > 0 ? (
                documents.map((doc, idx) => (
                  <DocumentRow key={doc.id || `${doc.name}-${idx}`} doc={doc} />
                ))
              ) : (
                <EmptyState icon={Upload} text="Todavia no hay documentos vinculados." />
              )}
            </div>
          </section>
        )}

        {activeTab === 'dates' && (
          <section className="space-y-5">
            <form onSubmit={handleAddDeadline} className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-5">
              <h4 className="mb-4 text-lg font-serif text-brand-ivory">Agregar vencimiento</h4>
              <div className="grid gap-3">
                <input
                  type="text"
                  value={deadlineForm.title}
                  onChange={(e) => setDeadlineForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej. Presentar escrito de subsanacion"
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none transition-colors placeholder:text-brand-accent/20 focus:border-brand-gold/40"
                />
                <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                  <input
                    type="date"
                    value={deadlineForm.date}
                    onChange={(e) => setDeadlineForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none transition-colors focus:border-brand-gold/40"
                  />
                  <select
                    value={deadlineForm.priority}
                    onChange={(e) => setDeadlineForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none transition-colors focus:border-brand-gold/40"
                  >
                    <option className="bg-brand-dark">Alta</option>
                    <option className="bg-brand-dark">Media</option>
                    <option className="bg-brand-dark">Baja</option>
                  </select>
                </div>
                <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-ivory px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-black transition-colors hover:bg-white">
                  <Plus className="h-4 w-4" />
                  Guardar fecha
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {importantDates.length > 0 ? (
                importantDates.map((item, idx) => (
                  <DeadlineRow key={item.id || `${item.title}-${idx}`} item={item} />
                ))
              ) : (
                <EmptyState icon={Calendar} text="No hay vencimientos registrados." />
              )}
            </div>
          </section>
        )}

        {activeTab === 'notes' && (
          <section className="space-y-5">
            <form onSubmit={handleAddNote} className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-5">
              <h4 className="mb-4 text-lg font-serif text-brand-ivory">Agregar nota interna</h4>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Registra acuerdos, observaciones, llamadas o decisiones del caso..."
                className="h-28 w-full resize-none rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none transition-colors placeholder:text-brand-accent/20 focus:border-brand-gold/40"
              />
              <button type="submit" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-ivory px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-black transition-colors hover:bg-white">
                <Plus className="h-4 w-4" />
                Guardar nota
              </button>
            </form>

            <div className="space-y-3">
              {notes.length > 0 ? (
                notes.map((note, idx) => (
                  <NoteRow key={note.id || `${note.date}-${idx}`} note={note} />
                ))
              ) : (
                <EmptyState icon={MessageSquare} text="Aun no hay notas internas." />
              )}
            </div>
          </section>
        )}

        {activeTab === 'ai' && (
          <section className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.015]">
            <div className="border-b border-white/[0.06] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-lg font-serif text-brand-ivory">IA del expediente</h4>
                  <p className="mt-1 text-xs text-brand-accent/45">
                    Responde usando los datos visibles del caso. La conexion a IA real vendra en la siguiente fase.
                  </p>
                </div>
                <div className="rounded-lg bg-brand-gold/10 p-3 text-brand-gold">
                  <Bot className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto p-5">
              {aiMessages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[86%] rounded-lg border px-4 py-3 text-sm leading-6 ${
                    message.role === 'user'
                      ? 'border-brand-gold/20 bg-brand-gold/10 text-brand-ivory'
                      : 'border-white/[0.06] bg-brand-black/30 text-brand-ivory/75'
                  }`}>
                    {message.content.split('\n').map((line, lineIndex) => (
                      <p key={lineIndex} className="mb-2 last:mb-0 whitespace-pre-wrap">{line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/[0.06] p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {[
                  'Resumen ejecutivo',
                  'Documentos faltantes',
                  'Proximos pasos',
                  'Riesgos del caso',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      const response = buildCaseResponse(prompt, caseData, documents, notes, importantDates);
                      setAiMessages(prev => [
                        ...prev,
                        { role: 'user', content: prompt },
                        { role: 'ai', content: response },
                      ]);
                    }}
                    className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-accent/60 transition-colors hover:border-brand-gold/25 hover:text-brand-ivory"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <form onSubmit={handleAskAi} className="flex gap-3">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Pregunta sobre este expediente..."
                  className="min-w-0 flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-brand-ivory outline-none transition-colors placeholder:text-brand-accent/20 focus:border-brand-gold/40"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-brand-ivory px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-brand-black transition-colors hover:bg-white"
                >
                  Enviar
                </button>
              </form>
            </div>
          </section>
        )}
      </div>

      <div className="border-t border-white/[0.06] bg-white/[0.01] p-5">
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          <p className="text-xs font-light text-brand-accent/70">
            Cambios guardados localmente. Listo para migrar a base de datos cuando conectemos Supabase.
          </p>
        </div>
      </div>
    </div>
  );
};

const SummaryMetric = ({ label, value }) => (
  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
    <p className="text-2xl font-serif text-brand-ivory">{value}</p>
    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-accent/45">{label}</p>
  </div>
);

const InfoCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-5">
    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-accent/45">
      <Icon className="h-4 w-4 text-brand-gold" />
      {label}
    </div>
    <p className="text-sm text-brand-ivory/80">{value}</p>
  </div>
);

const DocumentRow = ({ doc }) => (
  <div className="group flex items-center justify-between gap-4 rounded-lg border border-white/[0.06] bg-white/[0.015] p-4 transition-colors hover:bg-white/[0.03]">
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-brand-ivory/80">{doc.name}</p>
        <p className="mt-1 text-xs text-brand-accent/35">{doc.size || 'Archivo vinculado'}</p>
      </div>
    </div>
    <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-accent/35">{doc.date}</span>
  </div>
);

const DeadlineRow = ({ item }) => (
  <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-4">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-brand-ivory/85">{item.title}</p>
        <p className="mt-2 flex items-center gap-2 text-xs text-brand-gold">
          <Calendar className="h-3.5 w-3.5" />
          {item.date}
        </p>
      </div>
      <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
        item.priority === 'Alta'
          ? 'border-red-400/20 bg-red-500/10 text-red-300'
          : item.priority === 'Media'
            ? 'border-brand-gold/20 bg-brand-gold/10 text-brand-gold'
            : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
      }`}>
        {item.priority}
      </span>
    </div>
  </div>
);

const NoteRow = ({ note }) => (
  <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-4">
    <div className="mb-3 flex items-center justify-between gap-4">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-gold">{note.author}</span>
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-accent/35">{note.date}</span>
    </div>
    <p className="text-sm font-light leading-6 text-brand-ivory/72">{note.text}</p>
  </div>
);

const EmptyState = ({ icon: Icon, text }) => (
  <div className="rounded-lg border border-dashed border-white/[0.08] bg-white/[0.01] p-8 text-center">
    <Icon className="mx-auto mb-3 h-8 w-8 text-brand-accent/15" />
    <p className="text-sm text-brand-accent/35">{text}</p>
  </div>
);

const buildCaseResponse = (question, caseData, documents, notes, importantDates) => {
  const normalizedQuestion = question.toLowerCase();
  const documentList = documents.length
    ? documents.map((doc, index) => `${index + 1}. ${doc.name}${doc.date ? ` (${doc.date})` : ''}`).join('\n')
    : 'No hay documentos vinculados todavia.';
  const dateList = importantDates.length
    ? importantDates.map((item, index) => `${index + 1}. ${item.title} - ${item.date} [${item.priority}]`).join('\n')
    : 'No hay vencimientos registrados.';
  const latestNote = notes[0]?.text || 'No hay notas internas registradas.';

  if (normalizedQuestion.includes('resumen') || normalizedQuestion.includes('ejecutivo')) {
    return [
      `Resumen ejecutivo de ${caseData.id}`,
      `Cliente: ${caseData.clientName}`,
      `Materia: ${caseData.type}`,
      `Estado: ${caseData.status}`,
      `Resumen registrado: ${caseData.summary || 'Sin resumen registrado.'}`,
      `Documentos vinculados: ${documents.length}`,
      `Fechas importantes: ${importantDates.length}`,
      `Nota interna mas reciente: ${latestNote}`,
    ].join('\n');
  }

  if (normalizedQuestion.includes('documento') || normalizedQuestion.includes('archivo') || normalizedQuestion.includes('faltan')) {
    return [
      'Revision documental',
      documentList,
      '',
      documents.length
        ? 'Siguiente paso sugerido: clasificar cada documento por tipo, fecha, relevancia probatoria y relacion con el petitorio.'
        : 'Siguiente paso sugerido: subir demanda, anexos, comunicaciones relevantes y cualquier actuacion procesal disponible.',
    ].join('\n');
  }

  if (normalizedQuestion.includes('vencimiento') || normalizedQuestion.includes('fecha') || normalizedQuestion.includes('plazo')) {
    return [
      'Fechas y vencimientos del expediente',
      dateList,
      '',
      importantDates.length
        ? 'Recomendacion: revisar primero los items de prioridad Alta y confirmar responsable interno.'
        : 'Recomendacion: registra audiencia, plazo de contestacion, subsanaciones y fechas de seguimiento.',
    ].join('\n');
  }

  if (normalizedQuestion.includes('riesgo') || normalizedQuestion.includes('contingencia')) {
    return [
      'Riesgos preliminares detectables con la informacion actual',
      `1. Riesgo documental: ${documents.length ? 'hay documentos vinculados, pero falta clasificarlos por valor probatorio.' : 'no hay documentos vinculados al expediente.'}`,
      `2. Riesgo de plazo: ${importantDates.length ? 'existen fechas registradas que deben monitorearse.' : 'no hay vencimientos registrados.'}`,
      `3. Riesgo de estrategia: ${caseData.summary ? 'el resumen existe, pero conviene convertirlo en teoria del caso.' : 'falta un resumen operativo del caso.'}`,
      '',
      'Esto es una revision preliminar; debe validarse con el expediente completo.',
    ].join('\n');
  }

  if (normalizedQuestion.includes('paso') || normalizedQuestion.includes('tarea') || normalizedQuestion.includes('hacer')) {
    return [
      'Proximos pasos sugeridos',
      '1. Revisar y completar el resumen operativo del expediente.',
      documents.length ? '2. Clasificar documentos por demanda, prueba, comunicacion y actuacion.' : '2. Subir los documentos principales del caso.',
      importantDates.length ? '3. Confirmar responsables para los vencimientos registrados.' : '3. Registrar vencimientos, audiencias o fechas de seguimiento.',
      notes.length ? '4. Convertir notas internas en tareas accionables.' : '4. Agregar una primera nota interna con estado y estrategia.',
      '5. Preparar una consulta juridica especifica para el asistente.',
    ].join('\n');
  }

  if (normalizedQuestion.includes('borrador') || normalizedQuestion.includes('redacta') || normalizedQuestion.includes('escrito')) {
    return [
      'Borrador breve',
      `En el expediente ${caseData.id}, seguido por ${caseData.clientName}, correspondiente a materia ${caseData.type}, se deja constancia de que el caso se encuentra en estado ${caseData.status}.`,
      '',
      `Resumen base: ${caseData.summary || 'Pendiente de completar.'}`,
      '',
      'Se recomienda complementar este borrador con pretension, fundamentos de hecho, fundamentos de derecho y anexos disponibles.',
    ].join('\n');
  }

  return [
    'Puedo ayudarte con este expediente desde estas rutas:',
    '- Resumen ejecutivo del caso.',
    '- Revision de documentos vinculados.',
    '- Fechas y vencimientos.',
    '- Riesgos preliminares.',
    '- Proximos pasos.',
    '- Borrador breve.',
    '',
    'Prueba preguntando: "Dame los riesgos del caso" o "Prepara proximos pasos".',
  ].join('\n');
};

export default CaseDetailDrawer;
