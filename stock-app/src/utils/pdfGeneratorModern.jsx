import { pdf } from '@react-pdf/renderer'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Styles optimisés pour impression noir et blanc et espacement réduit
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    paddingBottom: 110,
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  companyDetails: {
    fontSize: 8,
    color: '#000000',
    lineHeight: 1.1,
  },
  documentInfo: {
    alignItems: 'flex-end',
    backgroundColor: '#F5F5F5',
    padding: 5,
    borderLeftWidth: 2,
    borderLeftColor: '#000000',
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 3,
  },
  documentNumber: {
    fontSize: 10,
    color: '#000000',
    marginBottom: 1,
  },
  documentDate: {
    fontSize: 8,
    color: '#000000',
  },
  clientSection: {
    backgroundColor: '#F5F5F5',
    padding: 5,
    marginBottom: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#000000',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  clientInfo: {
    fontSize: 8,
    color: '#000000',
    lineHeight: 1.2,
  },
  itemsSection: {
    marginBottom: 6,
  },
  itemsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 3,
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
  },
  tableHeaderCell: {
    padding: 3,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000000',
    borderRightWidth: 1,
    borderRightColor: '#000000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  tableRowEven: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    backgroundColor: '#F5F5F5',
  },
  tableCell: {
    padding: 2,
    fontSize: 7,
    color: '#000000',
    borderRightWidth: 1,
    borderRightColor: '#000000',
  },
  tableCellBold: {
    padding: 2,
    fontSize: 7,
    fontWeight: 'bold',
    color: '#000000',
    borderRightWidth: 1,
    borderRightColor: '#000000',
  },
  totalSection: {
    backgroundColor: '#E0E0E0',
    padding: 5,
    alignItems: 'flex-end',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#000000',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  paymentSection: {
    backgroundColor: '#FEF3C7',
    padding: 15,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 8,
  },
  paymentInfo: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 1.6,
  },
  signaturesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    marginBottom: 8,
    position: 'absolute',
    bottom: 60,
    left: 30,
    right: 30,
  },
  signatureBox: {
    width: '45%',
    textAlign: 'center',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    marginBottom: 3,
    height: 20,
  },
  signatureLabel: {
    fontSize: 7,
    color: '#000000',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 6,
    color: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 4,
    paddingBottom: 4,
  },
})

// Composant PDF pour Devis
export const QuotePDF = ({ documentData, shopInfo }) => {
  const totalAmount = documentData.selectedItems.reduce((sum, item) => sum + item.totalPrice, 0)
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{shopInfo?.name || 'DUKAPILOTE'}</Text>
            <Text style={styles.companyDetails}>
              {shopInfo?.location || 'Moroni, Comores'}
              {shopInfo?.phone && `\nTél: ${shopInfo.phone}`}
              {shopInfo?.email && `\nEmail: ${shopInfo.email}`}
            </Text>
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle}>DEVIS</Text>
            <Text style={styles.documentNumber}>N°: {documentData.number}</Text>
            <Text style={styles.documentDate}>Date: {new Date(documentData.date).toLocaleDateString('fr-FR')}</Text>
          </View>
        </View>

        {/* Section Client */}
        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>CLIENT</Text>
          <View style={styles.clientInfo}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>{documentData.clientInfo.name}</Text>
            {documentData.clientInfo.email && <Text>Email: {documentData.clientInfo.email}</Text>}
            {documentData.clientInfo.phone && <Text>Téléphone: {documentData.clientInfo.phone}</Text>}
            {documentData.clientInfo.address && <Text>Adresse: {documentData.clientInfo.address}</Text>}
          </View>
        </View>

        {/* Tableau des Articles */}
        <View style={styles.itemsSection}>
          <Text style={styles.itemsTitle}>ARTICLES</Text>
          <View style={styles.table}>
            {/* En-têtes */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '50%' }]}>Article</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Quantité</Text>
              <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Prix Unitaire</Text>
              <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Total</Text>
            </View>
            
            {/* Articles */}
            {documentData.selectedItems.map((item, index) => (
              <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowEven}>
                <Text style={[styles.tableCell, { width: '50%' }]}>{item.name}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, { width: '30%' }]}>{item.unitPrice.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')} KMF</Text>
                <Text style={[styles.tableCellBold, { width: '30%' }]}>{item.totalPrice.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')} KMF</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalAmount}>{totalAmount.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')} KMF</Text>
        </View>


        {/* Signatures - Position absolue en bas */}
        <View style={styles.signaturesSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}></View>
            <Text style={styles.signatureLabel}>Signature Client</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}></View>
            <Text style={styles.signatureLabel}>Signature Vendeur</Text>
          </View>
        </View>

        {/* Footer - Position absolue tout en bas */}
        <Text style={styles.footer}>
          Devis généré automatiquement par DukaPilote{'\n'}
          © {new Date().getFullYear()} - Système de Gestion de Stock
        </Text>
      </Page>
    </Document>
  )
}

// Composant PDF pour Facture
export const InvoicePDF = ({ documentData, shopInfo }) => {
  const totalAmount = documentData.selectedItems.reduce((sum, item) => sum + item.totalPrice, 0)
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{shopInfo?.name || 'DUKAPILOTE'}</Text>
            <Text style={styles.companyDetails}>
              {shopInfo?.location || 'Moroni, Comores'}
              {shopInfo?.phone && `\nTél: ${shopInfo.phone}`}
              {shopInfo?.email && `\nEmail: ${shopInfo.email}`}
            </Text>
          </View>
          <View style={[styles.documentInfo, { borderLeftColor: '#000000' }]}>
            <Text style={[styles.documentTitle, { color: '#000000' }]}>FACTURE</Text>
            <Text style={styles.documentNumber}>N°: {documentData.number}</Text>
            <Text style={styles.documentDate}>Date: {new Date(documentData.date).toLocaleDateString('fr-FR')}</Text>
          </View>
        </View>

        {/* Section Client */}
        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>CLIENT</Text>
          <View style={styles.clientInfo}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>{documentData.clientInfo.name}</Text>
            {documentData.clientInfo.email && <Text>Email: {documentData.clientInfo.email}</Text>}
            {documentData.clientInfo.phone && <Text>Téléphone: {documentData.clientInfo.phone}</Text>}
            {documentData.clientInfo.address && <Text>Adresse: {documentData.clientInfo.address}</Text>}
          </View>
        </View>

        {/* Tableau des Articles */}
        <View style={styles.itemsSection}>
          <Text style={styles.itemsTitle}>ARTICLES</Text>
          <View style={styles.table}>
            {/* En-têtes */}
            <View style={[styles.tableHeader, { backgroundColor: '#E0E0E0' }]}>
              <Text style={[styles.tableHeaderCell, { width: '50%' }]}>Article</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Quantité</Text>
              <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Prix Unitaire</Text>
              <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Total</Text>
            </View>
            
            {/* Articles */}
            {documentData.selectedItems.map((item, index) => (
              <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowEven}>
                <Text style={[styles.tableCell, { width: '50%' }]}>{item.name}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, { width: '30%' }]}>{item.unitPrice.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')} KMF</Text>
                <Text style={[styles.tableCellBold, { width: '30%' }]}>{item.totalPrice.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')} KMF</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>TOTAL À PAYER</Text>
          <Text style={styles.totalAmount}>{totalAmount.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')} KMF</Text>
        </View>

        {/* Signatures - Position absolue en bas */}
        <View style={styles.signaturesSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}></View>
            <Text style={styles.signatureLabel}>Signature Client</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}></View>
            <Text style={styles.signatureLabel}>Signature Vendeur</Text>
          </View>
        </View>

        {/* Footer - Position absolue tout en bas */}
        <Text style={styles.footer}>
          Facture générée automatiquement par DukaPilote{'\n'}
          © {new Date().getFullYear()} - Système de Gestion de Stock
        </Text>
      </Page>
    </Document>
  )
}

// Fonctions de génération et téléchargement
export const generateQuotePDF = async (documentData, shopInfo = null) => {
  const blob = await pdf(<QuotePDF documentData={documentData} shopInfo={shopInfo} />).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Devis_${documentData.number}_${new Date().toISOString().split('T')[0]}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const generateInvoicePDF = async (documentData, shopInfo = null) => {
  const blob = await pdf(<InvoicePDF documentData={documentData} shopInfo={shopInfo} />).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Facture_${documentData.number}_${new Date().toISOString().split('T')[0]}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const generatePDFBlob = async (documentData, type = 'quote', shopInfo = null) => {
  if (type === 'quote') {
    return await pdf(<QuotePDF documentData={documentData} shopInfo={shopInfo} />).toBlob()
  } else {
    return await pdf(<InvoicePDF documentData={documentData} shopInfo={shopInfo} />).toBlob()
  }
}

export const downloadPDF = async (documentData, type = 'quote', shopInfo = null) => {
  if (type === 'quote') {
    await generateQuotePDF(documentData, shopInfo)
  } else {
    await generateInvoicePDF(documentData, shopInfo)
  }
}
