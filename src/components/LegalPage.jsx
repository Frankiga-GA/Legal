const legalCopy = {
  privacy: {
    title: 'Politica de Privacidad',
    updated: 'Actualizado: 1 de junio de 2026',
    intro:
      'LUSTI ayuda a estudios legales y usuarios autorizados a organizar expedientes, analizar documentos y generar borradores con asistencia de IA.',
    sections: [
      {
        title: 'Informacion que procesamos',
        body:
          'Procesamos datos de cuenta, expedientes, documentos cargados por el usuario, archivos seleccionados desde Google Drive y consultas enviadas al asistente. Esta informacion se usa para prestar las funciones de gestion documental e IA legal.',
      },
      {
        title: 'Uso de Google Drive',
        body:
          'Cuando el usuario conecta Google Drive, LUSTI solicita acceso de solo lectura para listar y leer archivos seleccionados o visibles para esa cuenta. LUSTI no modifica, elimina ni comparte archivos de Drive.',
      },
      {
        title: 'Uso de IA',
        body:
          'Las consultas y el contenido documental pueden enviarse al proveedor de IA configurado para generar respuestas, resumenes, analisis o documentos solicitados por el usuario.',
      },
      {
        title: 'Seguridad y acceso',
        body:
          'El acceso a la aplicacion requiere autenticacion. Los datos se organizan por usuario u organizacion segun la configuracion del sistema.',
      },
      {
        title: 'Contacto',
        body:
          'Para consultas sobre privacidad o eliminacion de datos, contacta al correo de soporte configurado para la aplicacion.',
      },
    ],
  },
  terms: {
    title: 'Condiciones del Servicio',
    updated: 'Actualizado: 1 de junio de 2026',
    intro:
      'Estas condiciones regulan el uso de LUSTI como herramienta de asistencia documental y gestion legal.',
    sections: [
      {
        title: 'Uso permitido',
        body:
          'El usuario debe usar LUSTI para fines legales, documentales y administrativos permitidos por la ley. El usuario es responsable de la informacion que carga o conecta.',
      },
      {
        title: 'Asistencia legal e IA',
        body:
          'Las respuestas generadas por IA son asistencia preliminar y deben ser revisadas por un profesional legal antes de su uso definitivo.',
      },
      {
        title: 'Google Drive',
        body:
          'La integracion con Google Drive usa permisos de solo lectura para acceder a documentos autorizados por el usuario. El usuario puede desconectar Drive desde la configuracion de la aplicacion o desde su cuenta Google.',
      },
      {
        title: 'Disponibilidad',
        body:
          'LUSTI puede cambiar, mejorar o suspender funciones para mantener seguridad, rendimiento y calidad del servicio.',
      },
      {
        title: 'Contacto',
        body:
          'Para soporte o consultas sobre estas condiciones, contacta al correo de soporte configurado para la aplicacion.',
      },
    ],
  },
};

const LegalPage = ({ type = 'privacy' }) => {
  const copy = legalCopy[type] || legalCopy.privacy;

  return (
    <main className="min-h-screen bg-brand-black px-5 py-10 text-brand-ivory sm:px-8">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-gold">
          LUSTI
        </a>
        <h1 className="mt-6 font-serif text-4xl font-medium tracking-tight sm:text-5xl">{copy.title}</h1>
        <p className="mt-3 text-sm text-brand-accent/50">{copy.updated}</p>
        <p className="mt-8 text-base leading-7 text-brand-ivory/80">{copy.intro}</p>

        <div className="mt-10 space-y-8">
          {copy.sections.map((section) => (
            <section key={section.title} className="border-t border-white/[0.08] pt-6">
              <h2 className="font-serif text-2xl text-brand-ivory">{section.title}</h2>
              <p className="mt-3 leading-7 text-brand-accent/70">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
};

export default LegalPage;
