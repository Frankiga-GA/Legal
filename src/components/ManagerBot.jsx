// =============================================================================
// src/components/ManagerBot.jsx
// =============================================================================
// Stub post-simplificacion (v3.0): la funcionalidad de "Asistentes" y
// "Plantillas" dependia de tablas por organizacion (assistants,
// assistant_templates, file_templates) que se eliminaron.
//
// En esta version, ManagerBot es solo un placeholder informativo. Si mas
// adelante se quiere re-habilitar, hay que migrar esas tablas a "por
// usuario" (reemplazar organization_id por user_id) y restaurar la logica.
// =============================================================================

import { Bot, Sparkles } from 'lucide-react';

const ManagerBot = () => (
  <div className="min-h-screen bg-brand-black p-8 md:p-12">
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <h2 className="flex items-center gap-4 text-4xl font-serif font-medium tracking-tight text-brand-ivory">
          <Bot className="h-8 w-8 text-brand-gold" />
          Asistentes y Plantillas
        </h2>
        <p className="text-sm font-light tracking-wide text-brand-accent/60">
          Modulo en pausa tras la simplificacion multi-tenant a single-user.
        </p>
      </header>

      <div className="rounded-lg border border-white/[0.05] bg-white/[0.01] p-10">
        <div className="flex items-start gap-4">
          <Sparkles className="mt-1 h-6 w-6 flex-shrink-0 text-brand-gold" />
          <div className="space-y-3 text-sm font-light leading-relaxed text-brand-accent/70">
            <p>
              Esta funcionalidad requeria tablas por organizacion
              (<code className="text-brand-ivory">assistants</code>,
              <code className="text-brand-ivory"> assistant_templates</code>,
              <code className="text-brand-ivory"> file_templates</code>) que se deshabilitaron
              en la v3.0 para simplificar el modelo de datos.
            </p>
            <p>
              Por ahora los expedientes, el chat con IA y la generacion de
              documentos siguen funcionando con normalidad. Esta vista queda
              como placeholder.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ManagerBot;
