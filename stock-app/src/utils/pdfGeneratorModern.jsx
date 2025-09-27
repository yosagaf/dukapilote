import { pdf } from '@react-pdf/renderer'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Styles optimisés pour impression noir et blanc avec design élégant
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    paddingBottom: 120,
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    borderBottomStyle: 'solid',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#000000',
    lineHeight: 1.3,
    letterSpacing: 0.2,
  },
  documentInfo: {
    alignItems: 'flex-end',
    backgroundColor: '#F8F8F8',
    padding: 12,
    minWidth: 120,
  },
  documentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
    letterSpacing: 1,
  },
  documentNumber: {
    fontSize: 11,
    color: '#000000',
    marginBottom: 2,
    fontWeight: 'bold',
  },
  documentDate: {
    fontSize: 9,
    color: '#000000',
    fontWeight: 'bold',
  },
  clientSection: {
    backgroundColor: '#F8F8F8',
    padding: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  clientInfo: {
    fontSize: 9,
    color: '#000000',
    lineHeight: 1.4,
    letterSpacing: 0.1,
  },
  clientInfoCentered: {
    fontSize: 9,
    color: '#000000',
    lineHeight: 1.4,
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  itemsSection: {
    marginBottom: 10,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 2,
    borderColor: '#000000',
    marginTop: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E8E8E8',
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  tableHeaderCell: {
    padding: 6,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000000',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    minHeight: 25,
  },
  tableRowEven: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    backgroundColor: '#F8F8F8',
    minHeight: 25,
  },
  tableCell: {
    padding: 5,
    fontSize: 8,
    color: '#000000',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    lineHeight: 1.3,
    letterSpacing: 0.1,
  },
  tableCellBold: {
    padding: 5,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000000',
    borderRightWidth: 1,
    borderRightColor: '#000000',
    lineHeight: 1.3,
    letterSpacing: 0.1,
  },
  totalSection: {
    backgroundColor: '#E8E8E8',
    padding: 12,
    alignItems: 'flex-end',
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 0.5,
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
    bottom: 40,
    left: 40,
    right: 40,
  },
  signatureBox: {
    width: '45%',
    textAlign: 'center',
    padding: 10,
    backgroundColor: 'transparent',
  },
  signatureLine: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    marginBottom: 5,
    height: 25,
    borderBottomStyle: 'solid',
  },
  signatureLabel: {
    fontSize: 8,
    color: '#000000',
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 7,
    color: '#000000',
    borderTopWidth: 2,
    borderTopColor: '#000000',
    paddingTop: 6,
    paddingBottom: 6,
    backgroundColor: '#F8F8F8',
    letterSpacing: 0.2,
    fontWeight: 'bold',
  },
})

// Composant PDF pour Devis
export const QuotePDF = ({ documentData, shopInfo }) => {
  const calculatedAmount = documentData.selectedItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const discountAmount = documentData.discountAmount || 0
  const subtotalAfterDiscount = documentData.subtotalAfterDiscount || calculatedAmount
  const finalAmount = documentData.totalAmount || subtotalAfterDiscount
  const showCalculatedAmount = documentData.showCalculatedAmount !== false
  const showDiscountInPDF = documentData.showDiscountInPDF !== false
  const hasDiscount = discountAmount > 0 && showDiscountInPDF
  
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
              {shopInfo?.phone2 && `\nTél 2: ${shopInfo.phone2}`}
              {shopInfo?.email && `\nEmail: ${shopInfo.email}`}
            </Text>
          </View>
          <View style={[styles.documentInfo, { backgroundColor: 'transparent' }]}>
            <Text style={styles.documentTitle}>DEVIS</Text>
            <Text style={styles.documentNumber}>N°: {documentData.number}</Text>
            <Text style={styles.documentDate}>Date: {new Date(documentData.date).toLocaleDateString('fr-FR')}</Text>
          </View>
        </View>

        {/* Ligne de séparation décorative */}
        <View style={{ height: 2, backgroundColor: '#000000', marginBottom: 10 }}></View>

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
              <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Prix Unitaire (KMF)</Text>
              <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Total (KMF)</Text>
            </View>
            
            {/* Articles */}
            {documentData.selectedItems.map((item, index) => (
              <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowEven}>
                <Text style={[styles.tableCell, { width: '50%' }]}>{item.name}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, { width: '30%' }]}>{item.unitPrice.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')}</Text>
                <Text style={[styles.tableCellBold, { width: '30%' }]}>{item.totalPrice.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          {hasDiscount ? (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={[styles.totalLabel, { fontSize: 10 }]}>TOTAL NET</Text>
                <Text style={[styles.totalAmount, { fontSize: 12 }]}>{calculatedAmount.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={[styles.totalLabel, { fontSize: 10 }]}>
                  REMISE ({documentData.discountType === 'percentage' ? `${documentData.discountValue}%` : 'Montant fixe'})
                </Text>
                <Text style={[styles.totalAmount, { fontSize: 12, color: '#DC2626' }]}>
                  -{discountAmount.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')}
                </Text>
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: '#000000', paddingTop: 5, marginTop: 5 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.totalLabel}>TOTAL À PAYER (KMF)</Text>
                  <Text style={styles.totalAmount}>{finalAmount.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')}</Text>
                </View>
              </View>
            </View>
          ) : finalAmount !== calculatedAmount ? (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={[styles.totalLabel, { fontSize: 10 }]}>TOTAL NET</Text>
                <Text style={[styles.totalAmount, { fontSize: 12 }]}>{calculatedAmount.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')}</Text>
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: '#000000', paddingTop: 5, marginTop: 5 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.totalLabel}>TOTAL À PAYER (KMF)</Text>
                  <Text style={styles.totalAmount}>{finalAmount.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.totalLabel}>TOTAL À PAYER (KMF)</Text>
              <Text style={styles.totalAmount}>{finalAmount.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')}</Text>
            </View>
          )}
        </View>

        {/* Ligne de séparation avant signatures */}
        <View style={{ height: 1, backgroundColor: '#000000', marginTop: 15, marginBottom: 10 }}></View>


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
  const calculatedAmount = documentData.selectedItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const discountAmount = documentData.discountAmount || 0
  const subtotalAfterDiscount = documentData.subtotalAfterDiscount || calculatedAmount
  const finalAmount = documentData.totalAmount || subtotalAfterDiscount
  const showCalculatedAmount = documentData.showCalculatedAmount !== false
  const showDiscountInPDF = documentData.showDiscountInPDF !== false
  const hasDiscount = discountAmount > 0 && showDiscountInPDF
  
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
              {shopInfo?.phone2 && `\nTél 2: ${shopInfo.phone2}`}
              {shopInfo?.email && `\nEmail: ${shopInfo.email}`}
            </Text>
          </View>
          <View style={[styles.documentInfo, { backgroundColor: 'transparent' }]}>
            <Text style={styles.documentTitle}>FACTURE</Text>
            <Text style={styles.documentNumber}>N°: {documentData.number}</Text>
            <Text style={styles.documentDate}>Date: {new Date(documentData.date).toLocaleDateString('fr-FR')}</Text>
          </View>
        </View>

        {/* Ligne de séparation décorative */}
        <View style={{ height: 2, backgroundColor: '#000000', marginBottom: 10 }}></View>

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
              <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Prix Unitaire (KMF)</Text>
              <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Total (KMF)</Text>
            </View>
            
            {/* Articles */}
            {documentData.selectedItems.map((item, index) => (
              <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowEven}>
                <Text style={[styles.tableCell, { width: '50%' }]}>{item.name}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, { width: '30%' }]}>{item.unitPrice.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')}</Text>
                <Text style={[styles.tableCellBold, { width: '30%' }]}>{item.totalPrice.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          {hasDiscount ? (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={[styles.totalLabel, { fontSize: 10 }]}>TOTAL NET</Text>
                <Text style={[styles.totalAmount, { fontSize: 12 }]}>{calculatedAmount.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={[styles.totalLabel, { fontSize: 10 }]}>
                  REMISE ({documentData.discountType === 'percentage' ? `${documentData.discountValue}%` : 'Montant fixe'})
                </Text>
                <Text style={[styles.totalAmount, { fontSize: 12, color: '#DC2626' }]}>
                  -{discountAmount.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')}
                </Text>
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: '#000000', paddingTop: 5, marginTop: 5 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.totalLabel}>TOTAL À PAYER (KMF)</Text>
                  <Text style={styles.totalAmount}>{finalAmount.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')}</Text>
                </View>
              </View>
            </View>
          ) : finalAmount !== calculatedAmount ? (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={[styles.totalLabel, { fontSize: 10 }]}>TOTAL NET</Text>
                <Text style={[styles.totalAmount, { fontSize: 12 }]}>{calculatedAmount.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')}</Text>
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: '#000000', paddingTop: 5, marginTop: 5 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.totalLabel}>TOTAL À PAYER (KMF)</Text>
                  <Text style={styles.totalAmount}>{finalAmount.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.totalLabel}>TOTAL À PAYER (KMF)</Text>
              <Text style={styles.totalAmount}>{finalAmount.toLocaleString('fr-FR').replace(/\//g, '').replace(/\s/g, '')}</Text>
            </View>
          )}
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
