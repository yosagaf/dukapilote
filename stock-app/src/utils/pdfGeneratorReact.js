import React from 'react'
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer'

// Enregistrer les polices pour un meilleur rendu
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2' },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc4.woff2', fontWeight: 'bold' },
  ],
})

// Styles modernes et professionnels
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 60,
    fontFamily: 'Roboto',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 1.4,
  },
  documentInfo: {
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  documentTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 10,
  },
  documentNumber: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 3,
  },
  documentDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  clientSection: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8,
  },
  clientInfo: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 1.5,
  },
  itemsSection: {
    marginBottom: 20,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
  },
  tableHeaderCell: {
    padding: 12,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableRowEven: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  tableCell: {
    padding: 10,
    fontSize: 10,
    color: '#374151',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  tableCellBold: {
    padding: 10,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  totalSection: {
    backgroundColor: '#1F2937',
    padding: 15,
    borderRadius: 8,
    alignItems: 'flex-end',
    marginTop: 20,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  conditionsSection: {
    backgroundColor: '#FEF3C7',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  conditionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 8,
  },
  conditionsList: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 1.6,
  },
  paymentSection: {
    backgroundColor: '#FEF3C7',
    padding: 15,
    borderRadius: 8,
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
  footer: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#6B7280',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 15,
  },
})

// Composant PDF pour Devis
const QuotePDF = ({ documentData, shopInfo }) => {
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
              {shopInfo?.phone2 && `\nTél 2: ${shopInfo.phone2}`}
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
              <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Article</Text>
              <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Quantité</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Prix Unitaire</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Total</Text>
              <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Catégorie</Text>
            </View>
            
            {/* Articles */}
            {documentData.selectedItems.map((item, index) => (
              <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowEven}>
                <Text style={[styles.tableCell, { width: '40%' }]}>{item.name}</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{item.unitPrice.toLocaleString('fr-FR')} KMF</Text>
                <Text style={[styles.tableCellBold, { width: '20%' }]}>{item.totalPrice.toLocaleString('fr-FR')} KMF</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>{item.category || '-'}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalAmount}>{totalAmount.toLocaleString('fr-FR')} KMF</Text>
        </View>

        {/* Conditions */}
        <View style={styles.conditionsSection}>
          <Text style={styles.conditionsTitle}>CONDITIONS</Text>
          <Text style={styles.conditionsList}>
            • Validité: 30 jours{'\n'}
            • Paiement: Comptant ou 30 jours{'\n'}
            • Livraison: Selon disponibilité
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Devis généré automatiquement par DukaPilote{'\n'}
          © {new Date().getFullYear()} - Système de Gestion de Stock
        </Text>
      </Page>
    </Document>
  )
}

// Composant PDF pour Facture
const InvoicePDF = ({ documentData, shopInfo }) => {
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
              {shopInfo?.phone2 && `\nTél 2: ${shopInfo.phone2}`}
              {shopInfo?.email && `\nEmail: ${shopInfo.email}`}
            </Text>
          </View>
          <View style={[styles.documentInfo, { borderLeftColor: '#DC2626' }]}>
            <Text style={[styles.documentTitle, { color: '#DC2626' }]}>FACTURE</Text>
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
            <View style={[styles.tableHeader, { backgroundColor: '#DC2626' }]}>
              <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Article</Text>
              <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Quantité</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Prix Unitaire</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Total</Text>
              <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Catégorie</Text>
            </View>
            
            {/* Articles */}
            {documentData.selectedItems.map((item, index) => (
              <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowEven}>
                <Text style={[styles.tableCell, { width: '40%' }]}>{item.name}</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>{item.unitPrice.toLocaleString('fr-FR')} KMF</Text>
                <Text style={[styles.tableCellBold, { width: '20%' }]}>{item.totalPrice.toLocaleString('fr-FR')} KMF</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>{item.category || '-'}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>TOTAL À PAYER</Text>
          <Text style={styles.totalAmount}>{totalAmount.toLocaleString('fr-FR')} KMF</Text>
        </View>

        {/* Informations de Paiement */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>INFORMATIONS DE PAIEMENT</Text>
          <Text style={styles.paymentInfo}>
            Montant à payer: {totalAmount.toLocaleString('fr-FR')} KMF{'\n'}
            Date d'échéance: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}{'\n'}
            Mode de paiement: Espèces, Virement bancaire, Chèque
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Facture générée automatiquement par DukaPilote{'\n'}
          © {new Date().getFullYear()} - Système de Gestion de Stock
        </Text>
      </Page>
    </Document>
  )
}

// Fonction pour générer et télécharger un PDF
export const generateQuotePDF = (documentData, shopInfo = null) => {
  return (
    <PDFDownloadLink
      document={<QuotePDF documentData={documentData} shopInfo={shopInfo} />}
      fileName={`Devis_${documentData.number}_${new Date().toISOString().split('T')[0]}.pdf`}
    >
      {({ blob, url, loading, error }) => (loading ? 'Génération...' : 'Télécharger le PDF')}
    </PDFDownloadLink>
  )
}

export const generateInvoicePDF = (documentData, shopInfo = null) => {
  return (
    <PDFDownloadLink
      document={<InvoicePDF documentData={documentData} shopInfo={shopInfo} />}
      fileName={`Facture_${documentData.number}_${new Date().toISOString().split('T')[0]}.pdf`}
    >
      {({ blob, url, loading, error }) => (loading ? 'Génération...' : 'Télécharger le PDF')}
    </PDFDownloadLink>
  )
}

// Fonction de téléchargement direct
export const downloadPDF = (documentData, type = 'quote', shopInfo = null) => {
  const fileName = `${type === 'quote' ? 'Devis' : 'Facture'}_${documentData.number}_${new Date().toISOString().split('T')[0]}.pdf`
  
  if (type === 'quote') {
    return <PDFDownloadLink document={<QuotePDF documentData={documentData} shopInfo={shopInfo} />} fileName={fileName} />
  } else {
    return <PDFDownloadLink document={<InvoicePDF documentData={documentData} shopInfo={shopInfo} />} fileName={fileName} />
  }
}
