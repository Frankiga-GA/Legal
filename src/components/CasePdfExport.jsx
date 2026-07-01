import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 50,
    paddingTop: 35,
    fontSize: 10,
    color: '#1a1a1a',
    fontFamily: 'Helvetica',
  },
  headerCenter: {
    textAlign: 'center',
    marginBottom: 20,
  },
  lawFirm: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 2,
  },
  lawFirmSub: {
    fontSize: 7.5,
    color: '#666',
    marginBottom: 10,
  },
  dividerBold: {
    borderBottomWidth: 2,
    borderBottomColor: '#1a1a1a',
    marginBottom: 4,
  },
  dividerThin: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 14,
  },
  caseHeader: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  headerLabel: {
    width: 100,
    fontWeight: 700,
    fontSize: 9,
    color: '#1a1a1a',
  },
  headerValue: {
    flex: 1,
    fontSize: 9,
    color: '#1a1a1a',
  },
  sumillaLabel: {
    width: 100,
    fontWeight: 700,
    fontSize: 9,
    color: '#1a1a1a',
    marginTop: 1,
  },
  sumillaValue: {
    flex: 1,
    fontSize: 9,
    color: '#1a1a1a',
    lineHeight: 1.4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  bodyText: {
    fontSize: 9.5,
    lineHeight: 1.7,
    color: '#1a1a1a',
    textAlign: 'justify',
    marginBottom: 6,
  },
  bodyTextIndented: {
    fontSize: 9.5,
    lineHeight: 1.7,
    color: '#1a1a1a',
    textAlign: 'justify',
    marginBottom: 6,
    paddingLeft: 20,
  },
  subsection: {
    fontSize: 9.5,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 4,
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 8,
    fontWeight: 700,
    color: '#fff',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    fontSize: 8.5,
    minHeight: 24,
    alignItems: 'center',
  },
  tableCellWide: { flex: 2.5, color: '#1a1a1a' },
  tableCell: { flex: 1, color: '#1a1a1a' },
  priorityHigh: { color: '#b91c1c', fontWeight: 700 },
  priorityMed: { color: '#b45309', fontWeight: 700 },
  priorityLow: { color: '#15803d', fontWeight: 700 },
  noteBlock: {
    marginBottom: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#ccc',
  },
  noteMeta: { fontSize: 7.5, color: '#999', marginBottom: 2 },
  noteText: { fontSize: 9, lineHeight: 1.6, color: '#1a1a1a' },
  docBlock: {
    marginBottom: 10,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#ccc',
  },
  docName: { fontSize: 9, fontWeight: 700, marginBottom: 2 },
  docMeta: { fontSize: 7.5, color: '#999', marginBottom: 3 },
  docContent: { fontSize: 8.5, lineHeight: 1.5, color: '#333' },
  docNoText: { fontSize: 8, color: '#aaa', fontStyle: 'italic' },
  closing: {
    marginTop: 24,
    paddingTop: 10,
    textAlign: 'center',
    fontSize: 7.5,
    color: '#999',
    lineHeight: 1.8,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 6,
    fontSize: 7,
    color: '#bbb',
  },
});

const priorityStyle = (p) => {
  const map = { alta: styles.priorityHigh, media: styles.priorityMed, baja: styles.priorityLow };
  return map[(p || '').toLowerCase()] || {};
};

const fields = (caseData) => [
  { label: 'Expediente', value: caseData.id, show: true },
  { label: 'Cliente', value: caseData.clientName, show: true },
  { label: 'Materia', value: caseData.type, show: !!caseData.type },
  { label: 'Estado', value: caseData.status, show: !!caseData.status },
  { label: 'Juez', value: caseData.judge, show: !!caseData.judge },
  { label: 'Especialista', value: caseData.specialist, show: !!caseData.specialist },
  { label: 'Demandado', value: caseData.defendant, show: !!caseData.defendant },
  { label: 'Demandante', value: caseData.plaintiff, show: !!caseData.plaintiff },
  { label: 'Última Actualización', value: caseData.lastUpdate, show: true },
];

const CasePdfExport = ({ caseData }) => {
  const now = new Date().toLocaleDateString('es-PE', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const visibleFields = fields(caseData).filter((f) => f.show);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerCenter}>
          <Text style={styles.lawFirm}>LUSTI</Text>
          <Text style={styles.lawFirmSub}>SISTEMA DE INTELIGENCIA LEGAL</Text>
        </View>

        <View style={styles.dividerBold} />
        <View style={styles.dividerThin} />

        <Text style={[styles.sectionTitle, { textAlign: 'center', marginBottom: 14 }]}>
          REPORTE DE EXPEDIENTE
        </Text>

        <View style={styles.caseHeader}>
          {visibleFields.map((f, i) => (
            <View style={styles.headerRow} key={i}>
              <Text style={styles.headerLabel}>{f.label}:</Text>
              <Text style={styles.headerValue}>{f.value || '-'}</Text>
            </View>
          ))}
          {caseData.summary && (
            <View style={[styles.headerRow, { marginTop: 2 }]}>
              <Text style={styles.sumillaLabel}>Sumilla:</Text>
              <Text style={styles.sumillaValue}>{caseData.summary}</Text>
            </View>
          )}
        </View>

        <View style={styles.dividerBold} />

        {caseData.latestProgress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ANÁLISIS LEGAL</Text>
            <Text style={styles.bodyText}>{caseData.latestProgress}</Text>
          </View>
        )}

        {caseData.importantDates?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PLAZOS Y VENCIMIENTOS</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellWide}>Concepto</Text>
              <Text style={styles.tableCell}>Fecha</Text>
              <Text style={styles.tableCell}>Prioridad</Text>
              <Text style={styles.tableCell}>Estado</Text>
            </View>
            {caseData.importantDates.map((d, i) => (
              <View style={styles.tableRow} key={d.id || i}>
                <Text style={styles.tableCellWide}>{d.title}</Text>
                <Text style={styles.tableCell}>{d.date || '-'}</Text>
                <Text style={[styles.tableCell, priorityStyle(d.priority)]}>{d.priority || '-'}</Text>
                <Text style={styles.tableCell}>{d.status || '-'}</Text>
              </View>
            ))}
          </View>
        )}

        {caseData.notes?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NOTAS DEL EXPEDIENTE</Text>
            {caseData.notes.map((n, i) => (
              <View style={styles.noteBlock} key={n.id || i}>
                <Text style={styles.noteMeta}>{n.author || 'Anónimo'} - {n.date || ''}</Text>
                <Text style={styles.noteText}>{n.text}</Text>
              </View>
            ))}
          </View>
        )}

        {caseData.documents?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DOCUMENTOS ADJUNTOS</Text>
            {caseData.documents.map((d, i) => (
              <View style={styles.docBlock} key={d.id || i}>
                <Text style={styles.docName}>{d.name}</Text>
                <Text style={styles.docMeta}>{d.date || ''}{d.type ? ` | ${d.type}` : ''}{d.source === 'drive' ? ' | Google Drive' : ''}</Text>
                {d.source === 'drive' && d.webViewLink && (
                  <Text style={[styles.docMeta, { color: '#2563eb' }]}>Enlace: {d.webViewLink}</Text>
                )}
                {d.content ? (
                  <Text style={styles.docContent}>{d.content}</Text>
                ) : (
                  <Text style={styles.docNoText}>No se pudo extraer el texto de este documento.</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.closing}>
          <Text>Reporte generado automáticamente por LUSTI Legal Intelligence el {now}.</Text>
          <Text>La información contenida es confidencial y de uso exclusivo del destinatario.</Text>
        </View>

        <Text style={styles.footer}>
          <Text>LUSTI Legal Intelligence</Text>
          <Text>Página 1 de 1</Text>
        </Text>
      </Page>
    </Document>
  );
};

export default CasePdfExport;
