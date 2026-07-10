import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Registrar fuentes estándar
Font.register({
  family: 'Times-Roman',
  src: 'Times-Roman'
});
Font.register({
  family: 'Times-Bold',
  src: 'Times-Bold'
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 110,   // Espacio para la imagen del header
    paddingBottom: 90, // Espacio para la imagen del footer
    paddingLeft: 60,
    paddingRight: 60,
    fontFamily: 'Times-Roman',
    fontSize: 12,
    lineHeight: 1.5,
  },
  // --- IMÁGENES DE MEMBRETE ---
  headerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 90,
    objectFit: 'contain',
    objectPosition: 'center top',
  },
  footerImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 70,
    objectFit: 'contain',
    objectPosition: 'center bottom',
  },
  
  // --- BLOQUE DE SUMILLA (Lado derecho) ---
  sumillaContainer: {
    marginLeft: 180, // Sangría fuerte para tirarlo a la derecha
    marginBottom: 40,
    fontSize: 11,
  },
  sumillaRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  sumillaLabel: {
    width: 110,
    fontFamily: 'Times-Bold',
  },
  sumillaValue: {
    flex: 1,
    textTransform: 'uppercase', // Valores de sumilla siempre en mayúscula
  },
  
  // --- CUERPO DEL DOCUMENTO ---
  bodyContainer: {
    marginTop: 10,
  },
  title: {
    fontFamily: 'Times-Bold',
    fontSize: 13,
    marginBottom: 25,
    textAlign: 'center',
    textDecoration: 'underline',
  },
  senorJuez: {
    fontFamily: 'Times-Bold',
    fontSize: 12,
    marginBottom: 20,
  },
  subtitle: {
    fontFamily: 'Times-Bold',
    fontSize: 12,
    marginTop: 15,
    marginBottom: 10,
  },
  apersonamiento: {
    fontSize: 12,
    marginBottom: 20,
    textAlign: 'justify',
    lineHeight: 1.5,
  },
  metaText: {
    fontSize: 12,
    marginBottom: 3, 
    textAlign: 'left',
    lineHeight: 1.2, // Interlineado sencillo para que se agrupen ordenadamente
  },
  asuntoText: {
    fontFamily: 'Times-Bold',
    fontSize: 12,
    marginTop: 15,
    marginBottom: 15,
    textAlign: 'left',
  },
  greeting: {
    fontSize: 12,
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'left',
  },
  paragraph: {
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'justify',
    lineHeight: 1.5,
  },
  atentamente: {
    fontSize: 12,
    marginTop: 15,
    marginBottom: 12, 
    textAlign: 'left',
  },
  
  // --- FIRMAS ---
  signatureContainer: {
    marginTop: 100,
    flexDirection: 'row',
    justifyContent: 'center', 
  },
  signatureBox: {
    width: 250,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 5,
  },
  signatureText: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  signatureSubText: {
    fontSize: 11,
    textAlign: 'center',
  },
});

// Función para parsear texto y detectar formatos
const renderTextWithFormatting = (text, isCartaNotarial, demandante) => {
  if (!text) return null;
  
  const paragraphs = text.split('\n').filter(p => p.trim() !== '');
  
  // Parseador inline para **negritas** (Markdown)
  const renderInline = (paraText) => {
    const parts = paraText.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <Text key={idx} style={{ fontFamily: 'Times-Bold' }}>{part.slice(2, -2)}</Text>;
      }
      return part;
    });
  };
  
  return paragraphs.map((para, i) => {
    // Si la IA generó tabulaciones, las limpiamos para que el formateador controle todo
    const pTrim = para.replace(/^\s+/, '').trim();
    const pUpper = pTrim.toUpperCase();
    
    const isLast = i === paragraphs.length - 1;

    const getElement = () => {
      // 1. Título de Documento (Carta Notarial, etc) -> Centrado y Subrayado
      const isDocTitle = pTrim.length < 80 && (pUpper === 'CARTA NOTARIAL' || pUpper === 'ESCRITO' || pUpper.startsWith('DEMANDA') || pUpper.startsWith('RECURSO DE APELACIÓN'));
      if (isDocTitle) {
        return <Text style={styles.title}>{renderInline(pTrim)}</Text>;
      }

      // 2. Título Principal (Dirigido a la autoridad) -> Izquierda y Negrita
      if (pUpper.startsWith('SEÑOR JUEZ') || pUpper.startsWith('SEÑOR FISCAL') || pUpper.startsWith('SEÑORA JUEZA')) {
        return <Text style={styles.senorJuez}>{renderInline(pTrim)}</Text>;
      }
      
      // 3. Bloque de Apersonamiento (Datos de identidad desplazados a la derecha)
      const isApersonamiento = !isCartaNotarial && (
                               pUpper.includes('IDENTIFICADO CON DNI') || 
                               pUpper.includes('IDENTIFICADA CON DNI') || 
                               pUpper.includes('A USTED RESPETUOSAMENTE DIGO') || 
                               pUpper.includes('ANTE USTED DIGO') ||
                               pUpper.includes('A UD. DIGO'));
                               
      if (isApersonamiento) {
        return (
          <Text style={styles.apersonamiento}>
            {renderInline(pTrim)}
          </Text>
        );
      }
      
      // 4. Metadatos tipo Carta Notarial (A:, De:, Domicilio, etc.) -> Agrupados y sin espacios gigantes
      const isMeta = pUpper.startsWith('A:') || 
                     pUpper.startsWith('DE:') || 
                     pUpper.startsWith('DOMICILIO:') || 
                     pUpper.startsWith('DIRIGIDA A') ||
                     pUpper.startsWith('CON DOMICILIO EN') ||
                     (isCartaNotarial && pUpper.startsWith('IDENTIFICADO')) ||
                     pUpper.startsWith('FECHA:');
      if (isMeta) {
        return <Text style={styles.metaText}>{renderInline(pTrim)}</Text>;
      }

      // 5. Asunto (Destacado)
      if (pUpper.startsWith('ASUNTO:')) {
        return <Text style={styles.asuntoText}>{renderInline(pTrim)}</Text>;
      }
      
      // 6. Subtítulos (Todo en mayúsculas, cortos)
      const isHeading = pUpper === pTrim && pTrim.length < 100 && pTrim.length > 3 && !pUpper.startsWith('A:') && !pUpper.startsWith('DE:');
      if (isHeading) {
        return <Text style={styles.subtitle}>{renderInline(pTrim)}</Text>;
      }
      
      // 7. Saludo formal genérico
      if (pUpper.startsWith('SEÑOR') || pUpper.startsWith('ESTIMADO')) {
        return <Text style={styles.greeting}>{renderInline(pTrim)}</Text>;
      }
      
      // 8. Despedida (con espacio para firma)
      if (pUpper.startsWith('ATENTAMENTE')) {
        return <Text style={styles.atentamente}>{renderInline(pTrim)}</Text>;
      }
      
      // 9. Párrafo normal justificado (sin sangría inicial)
      return (
        <Text style={styles.paragraph}>
          {renderInline(pTrim)}
        </Text>
      );
    };

    const element = getElement();

    // Si es el último párrafo de todo el documento, lo agrupamos con la firma usando wrap={false}
    // Así evitamos que la firma quede "huérfana" en una página en blanco.
    if (isLast) {
      return (
        <View key={i} wrap={false}>
          {element}
          <View style={styles.signatureContainer}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureText}>{demandante !== '_________________' ? demandante : 'FIRMA DEL SOLICITANTE'}</Text>
              <Text style={styles.signatureSubText}>DNI N° _________________</Text>
            </View>
          </View>
        </View>
      );
    }
    
    // Clonamos para inyectar la key en los elementos normales
    return React.cloneElement(element, { key: i });
  });
};

const DocumentPdfExport = ({ caseData, documentText, title, firmProfile }) => {
  const expediente = caseData?.id || '_________________';
  const materia = caseData?.type || '_________________';
  const juez = caseData?.judge || '_________________';
  const especialista = caseData?.specialist || '_________________';
  const cuaderno = caseData?.cuaderno || 'PRINCIPAL';
  const escritoNro = caseData?.escritoNro || '_________________';
  const demandado = caseData?.counterparty || '_________________';
  const demandante = caseData?.clientName || '_________________';
  
  const sumilla = title || 'ESCRITO';
  const isCartaNotarial = (sumilla).toUpperCase().includes('CARTA NOTARIAL');

  const headerSrc = firmProfile?.headerBase64;
  const footerSrc = firmProfile?.footerBase64;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* IMAGEN DE ENCABEZADO */}
        {headerSrc && <Image src={headerSrc} style={styles.headerImage} fixed />}

        {/* IMAGEN DE PIE DE PÁGINA */}
        {footerSrc && <Image src={footerSrc} style={styles.footerImage} fixed />}

        {/* BLOQUE DE SUMILLA (Oculto para Carta Notarial) */}
        {!isCartaNotarial && (
          <View style={styles.sumillaContainer}>
            <View style={styles.sumillaRow}>
              <Text style={styles.sumillaLabel}>EXPEDIENTE:</Text>
              <Text style={styles.sumillaValue}>{expediente}</Text>
            </View>
            <View style={styles.sumillaRow}>
              <Text style={styles.sumillaLabel}>MATERIA:</Text>
              <Text style={styles.sumillaValue}>{materia}</Text>
            </View>
            <View style={styles.sumillaRow}>
              <Text style={styles.sumillaLabel}>JUEZ:</Text>
              <Text style={styles.sumillaValue}>{juez}</Text>
            </View>
            <View style={styles.sumillaRow}>
              <Text style={styles.sumillaLabel}>ESPECIALISTA:</Text>
              <Text style={styles.sumillaValue}>{especialista}</Text>
            </View>
            <View style={styles.sumillaRow}>
              <Text style={styles.sumillaLabel}>CUADERNO:</Text>
              <Text style={styles.sumillaValue}>{cuaderno}</Text>
            </View>
            <View style={styles.sumillaRow}>
              <Text style={styles.sumillaLabel}>ESCRITO:</Text>
              <Text style={styles.sumillaValue}>{escritoNro}</Text>
            </View>
            <View style={styles.sumillaRow}>
              <Text style={styles.sumillaLabel}>DEMANDADO:</Text>
              <Text style={styles.sumillaValue}>{demandado}</Text>
            </View>
            <View style={styles.sumillaRow}>
              <Text style={styles.sumillaLabel}>DEMANDANTE:</Text>
              <Text style={styles.sumillaValue}>{demandante}</Text>
            </View>
            <View style={styles.sumillaRow}>
              <Text style={styles.sumillaLabel}>SUMILLA:</Text>
              <Text style={styles.sumillaValue}>{sumilla}</Text>
            </View>
          </View>
        )}

        {/* CUERPO DEL DOCUMENTO */}
        <View style={styles.bodyContainer}>
          {renderTextWithFormatting(documentText, isCartaNotarial, demandante)}
        </View>

      </Page>
    </Document>
  );
};

export default DocumentPdfExport;
