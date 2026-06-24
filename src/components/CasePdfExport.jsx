import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#c8a96e',
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#c8a96e',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 100,
    fontWeight: 600,
    color: '#444',
  },
  value: {
    flex: 1,
    color: '#1a1a1a',
  },
  urgencyBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 600,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    marginVertical: 12,
  },
  analysis: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#1a1a1a',
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    fontSize: 9,
    fontWeight: 700,
    color: '#666',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    fontSize: 9,
  },
  tableCell: {
    flex: 1,
  },
  tableCellWide: {
    flex: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 8,
    fontSize: 8,
    color: '#999',
  },
});

const urgencyColor = (u) => {
  if (!u) return '#fef3c7';
  const map = { alta: '#fee2e2', media: '#fef3c7', baja: '#dcfce7' };
  return map[u.toLowerCase()] || '#fef3c7';
};

const CasePdfExport = ({ caseData }) => {
  const now = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{caseData.name || 'Expediente'}</Text>
          <Text style={styles.subtitle}>Generado el {now} - LUSTI Legal Intelligence</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Expediente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cliente:</Text>
            <Text style={styles.value}>{caseData.clientName || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tipo:</Text>
            <Text style={styles.value}>{caseData.type || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Estado:</Text>
            <Text style={styles.value}>{caseData.status || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Urgencia:</Text>
            <Text style={[styles.value, { backgroundColor: urgencyColor(caseData.urgency), paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 9, fontWeight: 600, alignSelf: 'flex-start' }]}>{caseData.urgency || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Ultima actualizacion:</Text>
            <Text style={styles.value}>{caseData.lastUpdate || '-'}</Text>
          </View>
        </View>

        {caseData.summary && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Resumen</Text>
              <Text style={styles.analysis}>{caseData.summary}</Text>
            </View>
          </>
        )}

        {caseData.latestProgress && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Analisis de IA</Text>
              <Text style={styles.analysis}>{caseData.latestProgress}</Text>
            </View>
          </>
        )}

        {caseData.importantDates?.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Plazos y Fechas Importantes</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableCellWide}>Titulo</Text>
                  <Text style={styles.tableCell}>Fecha</Text>
                  <Text style={styles.tableCell}>Prioridad</Text>
                  <Text style={styles.tableCell}>Estado</Text>
                </View>
                {caseData.importantDates.map((d, i) => (
                  <View style={styles.tableRow} key={d.id || i}>
                    <Text style={styles.tableCellWide}>{d.title}</Text>
                    <Text style={styles.tableCell}>{d.date}</Text>
                    <Text style={styles.tableCell}>{d.priority || '-'}</Text>
                    <Text style={styles.tableCell}>{d.status || '-'}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {caseData.notes?.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notas</Text>
              {caseData.notes.map((n, i) => (
                <View key={n.id || i} style={{ marginBottom: 8 }}>
                  <View style={styles.row}>
                    <Text style={[styles.label, { width: 80 }]}>{n.author || 'Anonimo'}</Text>
                    <Text style={[styles.value, { color: '#999', fontSize: 9 }]}>{n.date || ''}</Text>
                  </View>
                  <Text style={[styles.analysis, { fontSize: 10, marginTop: 2 }]}>{n.text}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {caseData.documents?.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Documentos</Text>
              {caseData.documents.map((d, i) => (
                <View key={d.id || i} style={{ marginBottom: 12, padding: 8, backgroundColor: '#fafafa', borderRadius: 4 }}>
                  <View style={styles.row}>
                    <Text style={[styles.label, { width: 80 }]}>{d.name}</Text>
                    <Text style={[styles.value, { color: '#999', fontSize: 9 }]}>{d.date || ''}</Text>
                  </View>
                  {d.type && <Text style={[styles.analysis, { fontSize: 9, color: '#999', marginBottom: 4 }]}>Tipo: {d.type}</Text>}
                  {d.source === 'drive' && d.webViewLink && (
                    <Text style={[styles.analysis, { fontSize: 9, color: '#2563eb', marginBottom: 4 }]}>Drive: {d.webViewLink}</Text>
                  )}
                  {d.content ? (
                    <Text style={[styles.analysis, { fontSize: 9, lineHeight: 1.4, marginTop: 4 }]}>{d.content}</Text>
                  ) : (
                    <Text style={[styles.analysis, { fontSize: 9, color: '#999', fontStyle: 'italic' }]}>Sin texto extraido disponible.</Text>
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.footer}>
          <Text>LUSTI Legal Intelligence - Documento generado automaticamente</Text>
        </Text>
      </Page>
    </Document>
  );
};

export default CasePdfExport;
