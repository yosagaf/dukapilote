import jsPDF from 'jspdf'

// Fonction pour générer un PDF de devis avec style moderne et élégant
export const generateQuotePDF = (documentData, shopInfo = null) => {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPosition = margin

  // Configuration des couleurs modernes
  const colors = {
    primary: '#2563EB',      // Bleu moderne
    secondary: '#059669',    // Vert émeraude
    accent: '#7C3AED',       // Violet
    dark: '#1F2937',         // Gris foncé
    gray: '#6B7280',         // Gris moyen
    lightGray: '#F9FAFB',    // Gris très clair
    white: '#FFFFFF'
  }

  // Fonction pour ajouter du texte avec style
  const addText = (text, x, y, options = {}) => {
    const { fontSize = 10, fontStyle = 'normal', color = '#000000', align = 'left' } = options
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', fontStyle)
    doc.setTextColor(color)
    
    if (align === 'right') {
      const textWidth = doc.getTextWidth(text)
      doc.text(text, x - textWidth, y)
    } else if (align === 'center') {
      const textWidth = doc.getTextWidth(text)
      doc.text(text, x - textWidth/2, y)
    } else {
      doc.text(text, x, y)
    }
    
    return y + fontSize * 0.35
  }

  // Fonction pour ajouter une ligne
  const addLine = (x1, y1, x2, y2, color = '#000000', width = 0.5) => {
    doc.setDrawColor(color)
    doc.setLineWidth(width)
    doc.line(x1, y1, x2, y2)
  }

  // Fonction pour ajouter un rectangle arrondi (simulé)
  const addRect = (x, y, width, height, fillColor = null, strokeColor = '#000000') => {
    if (fillColor) {
      doc.setFillColor(fillColor)
      doc.rect(x, y, width, height, 'F')
    }
    if (strokeColor) {
      doc.setDrawColor(strokeColor)
      doc.rect(x, y, width, height)
    }
  }

  // Header moderne avec gradient simulé
  const companyName = shopInfo?.name || 'DUKAPILOTE'
  const companyLocation = shopInfo?.location || 'Moroni, Comores'
  const companyPhone = shopInfo?.phone || '+269 XXX XX XX'
  const companyEmail = shopInfo?.email || 'contact@dukapilote.com'
  
  // Bande colorée en haut
  addRect(0, 0, pageWidth, 8, colors.primary)
  
  // Logo/Entreprise section
  addText(companyName, margin, 25, { fontSize: 24, fontStyle: 'bold', color: colors.dark })
  addText(companyLocation, margin, 32, { fontSize: 11, color: colors.gray })
  
  // Contact info à droite
  let contactY = 20
  if (companyPhone) {
    addText(`📞 ${companyPhone}`, pageWidth - margin, contactY, { fontSize: 10, color: colors.gray, align: 'right' })
    contactY += 5
  }
  if (companyEmail) {
    addText(`✉️ ${companyEmail}`, pageWidth - margin, contactY, { fontSize: 10, color: colors.gray, align: 'right' })
  }
  
  yPosition = 45
  
  // Titre du document avec style moderne
  addText('DEVIS', pageWidth/2, yPosition, { fontSize: 28, fontStyle: 'bold', color: colors.primary, align: 'center' })
  yPosition += 15
  
  // Informations du document dans un encadré élégant
  addRect(margin, yPosition, pageWidth - 2*margin, 20, colors.lightGray)
  addText(`N°: ${documentData.number}`, margin + 10, yPosition + 8, { fontSize: 12, fontStyle: 'bold', color: colors.dark })
  addText(`Date: ${new Date(documentData.date).toLocaleDateString('fr-FR')}`, margin + 10, yPosition + 15, { fontSize: 10, color: colors.gray })
  addText('Validité: 30 jours', pageWidth - margin - 10, yPosition + 8, { fontSize: 10, color: colors.gray, align: 'right' })
  addText('Paiement: 30 jours', pageWidth - margin - 10, yPosition + 15, { fontSize: 10, color: colors.gray, align: 'right' })
  
  yPosition += 30
  
  // Section client avec design moderne
  addText('FACTURÉ À', margin, yPosition, { fontSize: 12, fontStyle: 'bold', color: colors.dark })
  yPosition += 8
  
  // Encadré client
  addRect(margin, yPosition, pageWidth - 2*margin, 25, colors.white, colors.lightGray)
  addText(documentData.clientInfo.name, margin + 8, yPosition + 8, { fontSize: 14, fontStyle: 'bold', color: colors.dark })
  yPosition += 12
  
  if (documentData.clientInfo.email) {
    addText(`📧 ${documentData.clientInfo.email}`, margin + 8, yPosition, { fontSize: 10, color: colors.gray })
    yPosition += 5
  }
  if (documentData.clientInfo.phone) {
    addText(`📞 ${documentData.clientInfo.phone}`, margin + 8, yPosition, { fontSize: 10, color: colors.gray })
    yPosition += 5
  }
  if (documentData.clientInfo.address) {
    addText(`📍 ${documentData.clientInfo.address}`, margin + 8, yPosition, { fontSize: 10, color: colors.gray })
  }
  
  yPosition += 20
  
  // Tableau des articles avec design moderne
  addText('DÉTAIL DES PRESTATIONS', margin, yPosition, { fontSize: 14, fontStyle: 'bold', color: colors.dark })
  yPosition += 10
  
  // En-têtes du tableau avec style moderne
  const colWidths = [70, 20, 30, 30, 20]
  const headers = ['Description', 'Qté', 'Prix U.', 'Total', 'Cat.']
  
  // Header du tableau avec couleur
  addRect(margin, yPosition, pageWidth - 2*margin, 12, colors.primary)
  let colX = margin + 5
  headers.forEach((header, index) => {
    addText(header, colX, yPosition + 8, { fontSize: 10, fontStyle: 'bold', color: colors.white })
    colX += colWidths[index]
  })
  
  yPosition += 15
  
  // Articles avec style alterné
  documentData.selectedItems.forEach((item, index) => {
    if (yPosition > pageHeight - 50) {
      doc.addPage()
      yPosition = margin
    }
    
    // Ligne alternée avec couleur subtile
    if (index % 2 === 0) {
      addRect(margin, yPosition - 3, pageWidth - 2*margin, 10, '#F8FAFC')
    }
    
    colX = margin + 5
    addText(item.name, colX, yPosition, { fontSize: 10, color: colors.dark })
    colX += colWidths[0]
    addText(item.quantity.toString(), colX, yPosition, { fontSize: 10, color: colors.dark })
    colX += colWidths[1]
    addText(`${item.unitPrice.toLocaleString('fr-FR')} KMF`, colX, yPosition, { fontSize: 10, color: colors.dark })
    colX += colWidths[2]
    addText(`${item.totalPrice.toLocaleString('fr-FR')} KMF`, colX, yPosition, { fontSize: 10, fontStyle: 'bold', color: colors.dark })
    colX += colWidths[3]
    addText(item.category || '-', colX, yPosition, { fontSize: 9, color: colors.gray })
    
    yPosition += 8
  })
  
  yPosition += 10
  
  // Ligne de séparation élégante
  addLine(margin, yPosition, pageWidth - margin, yPosition, colors.gray, 1)
  yPosition += 10
  
  // Total avec design moderne
  const totalAmount = documentData.selectedItems.reduce((sum, item) => sum + item.totalPrice, 0)
  addRect(margin, yPosition, pageWidth - 2*margin, 20, colors.secondary)
  addText('TOTAL HT', margin + 10, yPosition + 8, { fontSize: 14, fontStyle: 'bold', color: colors.white })
  addText(`${totalAmount.toLocaleString('fr-FR')} KMF`, pageWidth - margin - 10, yPosition + 8, { fontSize: 16, fontStyle: 'bold', color: colors.white, align: 'right' })
  addText('TVA non applicable', margin + 10, yPosition + 15, { fontSize: 9, color: colors.white })
  
  yPosition += 30
  
  // Conditions avec design moderne
  addText('CONDITIONS GÉNÉRALES', margin, yPosition, { fontSize: 12, fontStyle: 'bold', color: colors.dark })
  yPosition += 8
  
  addRect(margin, yPosition, pageWidth - 2*margin, 20, '#FEF3C7')
  addText('• Validité: 30 jours à compter de la date d\'émission', margin + 5, yPosition + 6, { fontSize: 9, color: '#92400E' })
  addText('• Paiement: Comptant ou 30 jours net', margin + 5, yPosition + 12, { fontSize: 9, color: '#92400E' })
  addText('• Livraison: Selon disponibilité des stocks', margin + 5, yPosition + 18, { fontSize: 9, color: '#92400E' })
  
  // Footer moderne
  const footerY = pageHeight - 20
  addLine(margin, footerY - 10, pageWidth - margin, footerY - 10, colors.lightGray, 0.5)
  addText('Merci pour votre confiance', pageWidth/2, footerY - 5, { fontSize: 10, align: 'center', color: colors.gray })
  addText(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth/2, footerY, { fontSize: 8, align: 'center', color: colors.gray })
  
  return doc
}

// Fonction pour générer un PDF de facture avec style moderne et élégant
export const generateInvoicePDF = (documentData, shopInfo = null) => {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPosition = margin

  // Configuration des couleurs modernes (rouge pour facture)
  const colors = {
    primary: '#DC2626',      // Rouge moderne
    secondary: '#059669',    // Vert émeraude
    accent: '#7C3AED',       // Violet
    dark: '#1F2937',         // Gris foncé
    gray: '#6B7280',         // Gris moyen
    lightGray: '#F9FAFB',    // Gris très clair
    white: '#FFFFFF'
  }

  // Fonction pour ajouter du texte avec style
  const addText = (text, x, y, options = {}) => {
    const { fontSize = 10, fontStyle = 'normal', color = '#000000', align = 'left' } = options
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', fontStyle)
    doc.setTextColor(color)
    
    if (align === 'right') {
      const textWidth = doc.getTextWidth(text)
      doc.text(text, x - textWidth, y)
    } else if (align === 'center') {
      const textWidth = doc.getTextWidth(text)
      doc.text(text, x - textWidth/2, y)
    } else {
      doc.text(text, x, y)
    }
    
    return y + fontSize * 0.35
  }

  // Fonction pour ajouter une ligne
  const addLine = (x1, y1, x2, y2, color = '#000000', width = 0.5) => {
    doc.setDrawColor(color)
    doc.setLineWidth(width)
    doc.line(x1, y1, x2, y2)
  }

  // Fonction pour ajouter un rectangle
  const addRect = (x, y, width, height, fillColor = null, strokeColor = '#000000') => {
    if (fillColor) {
      doc.setFillColor(fillColor)
      doc.rect(x, y, width, height, 'F')
    }
    if (strokeColor) {
      doc.setDrawColor(strokeColor)
      doc.rect(x, y, width, height)
    }
  }

  // Header moderne avec gradient simulé
  const companyName = shopInfo?.name || 'DUKAPILOTE'
  const companyLocation = shopInfo?.location || 'Moroni, Comores'
  const companyPhone = shopInfo?.phone || '+269 XXX XX XX'
  const companyEmail = shopInfo?.email || 'contact@dukapilote.com'
  
  // Bande colorée en haut
  addRect(0, 0, pageWidth, 8, colors.primary)
  
  // Logo/Entreprise section
  addText(companyName, margin, 25, { fontSize: 24, fontStyle: 'bold', color: colors.dark })
  addText(companyLocation, margin, 32, { fontSize: 11, color: colors.gray })
  
  // Contact info à droite
  let contactY = 20
  if (companyPhone) {
    addText(`📞 ${companyPhone}`, pageWidth - margin, contactY, { fontSize: 10, color: colors.gray, align: 'right' })
    contactY += 5
  }
  if (companyEmail) {
    addText(`✉️ ${companyEmail}`, pageWidth - margin, contactY, { fontSize: 10, color: colors.gray, align: 'right' })
  }
  
  yPosition = 45
  
  // Titre du document avec style moderne
  addText('FACTURE', pageWidth/2, yPosition, { fontSize: 28, fontStyle: 'bold', color: colors.primary, align: 'center' })
  yPosition += 15
  
  // Informations du document dans un encadré élégant
  addRect(margin, yPosition, pageWidth - 2*margin, 20, colors.lightGray)
  addText(`N°: ${documentData.number}`, margin + 10, yPosition + 8, { fontSize: 12, fontStyle: 'bold', color: colors.dark })
  addText(`Date: ${new Date(documentData.date).toLocaleDateString('fr-FR')}`, margin + 10, yPosition + 15, { fontSize: 10, color: colors.gray })
  addText('Échéance: 30 jours', pageWidth - margin - 10, yPosition + 8, { fontSize: 10, color: colors.gray, align: 'right' })
  addText('Paiement: 30 jours', pageWidth - margin - 10, yPosition + 15, { fontSize: 10, color: colors.gray, align: 'right' })
  
  yPosition += 30
  
  // Section client avec design moderne
  addText('FACTURÉ À', margin, yPosition, { fontSize: 12, fontStyle: 'bold', color: colors.dark })
  yPosition += 8
  
  // Encadré client
  addRect(margin, yPosition, pageWidth - 2*margin, 25, colors.white, colors.lightGray)
  addText(documentData.clientInfo.name, margin + 8, yPosition + 8, { fontSize: 14, fontStyle: 'bold', color: colors.dark })
  yPosition += 12
  
  if (documentData.clientInfo.email) {
    addText(`📧 ${documentData.clientInfo.email}`, margin + 8, yPosition, { fontSize: 10, color: colors.gray })
    yPosition += 5
  }
  if (documentData.clientInfo.phone) {
    addText(`📞 ${documentData.clientInfo.phone}`, margin + 8, yPosition, { fontSize: 10, color: colors.gray })
    yPosition += 5
  }
  if (documentData.clientInfo.address) {
    addText(`📍 ${documentData.clientInfo.address}`, margin + 8, yPosition, { fontSize: 10, color: colors.gray })
  }
  
  yPosition += 20
  
  // Tableau des articles avec design moderne
  addText('DÉTAIL DES PRESTATIONS', margin, yPosition, { fontSize: 14, fontStyle: 'bold', color: colors.dark })
  yPosition += 10
  
  // En-têtes du tableau avec style moderne
  const colWidths = [70, 20, 30, 30, 20]
  const headers = ['Description', 'Qté', 'Prix U.', 'Total', 'Cat.']
  
  // Header du tableau avec couleur
  addRect(margin, yPosition, pageWidth - 2*margin, 12, colors.primary)
  let colX = margin + 5
  headers.forEach((header, index) => {
    addText(header, colX, yPosition + 8, { fontSize: 10, fontStyle: 'bold', color: colors.white })
    colX += colWidths[index]
  })
  
  yPosition += 15
  
  // Articles avec style alterné
  documentData.selectedItems.forEach((item, index) => {
    if (yPosition > pageHeight - 50) {
      doc.addPage()
      yPosition = margin
    }
    
    // Ligne alternée avec couleur subtile
    if (index % 2 === 0) {
      addRect(margin, yPosition - 3, pageWidth - 2*margin, 10, '#F8FAFC')
    }
    
    colX = margin + 5
    addText(item.name, colX, yPosition, { fontSize: 10, color: colors.dark })
    colX += colWidths[0]
    addText(item.quantity.toString(), colX, yPosition, { fontSize: 10, color: colors.dark })
    colX += colWidths[1]
    addText(`${item.unitPrice.toLocaleString('fr-FR')} KMF`, colX, yPosition, { fontSize: 10, color: colors.dark })
    colX += colWidths[2]
    addText(`${item.totalPrice.toLocaleString('fr-FR')} KMF`, colX, yPosition, { fontSize: 10, fontStyle: 'bold', color: colors.dark })
    colX += colWidths[3]
    addText(item.category || '-', colX, yPosition, { fontSize: 9, color: colors.gray })
    
    yPosition += 8
  })
  
  yPosition += 10
  
  // Ligne de séparation élégante
  addLine(margin, yPosition, pageWidth - margin, yPosition, colors.gray, 1)
  yPosition += 10
  
  // Total avec design moderne
  const totalAmount = documentData.selectedItems.reduce((sum, item) => sum + item.totalPrice, 0)
  addRect(margin, yPosition, pageWidth - 2*margin, 20, colors.secondary)
  addText('TOTAL À PAYER', margin + 10, yPosition + 8, { fontSize: 14, fontStyle: 'bold', color: colors.white })
  addText(`${totalAmount.toLocaleString('fr-FR')} KMF`, pageWidth - margin - 10, yPosition + 8, { fontSize: 16, fontStyle: 'bold', color: colors.white, align: 'right' })
  addText('TVA non applicable', margin + 10, yPosition + 15, { fontSize: 9, color: colors.white })
  
  yPosition += 30
  
  // Informations de paiement avec design moderne
  addText('INFORMATIONS DE PAIEMENT', margin, yPosition, { fontSize: 12, fontStyle: 'bold', color: colors.dark })
  yPosition += 8
  
  addRect(margin, yPosition, pageWidth - 2*margin, 25, '#FEF3C7')
  addText(`💰 Montant: ${totalAmount.toLocaleString('fr-FR')} KMF`, margin + 5, yPosition + 6, { fontSize: 10, fontStyle: 'bold', color: '#92400E' })
  addText(`📅 Échéance: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}`, margin + 5, yPosition + 12, { fontSize: 10, color: '#92400E' })
  addText(`💳 Modes: Espèces, Virement, Chèque`, margin + 5, yPosition + 18, { fontSize: 10, color: '#92400E' })
  
  // Footer moderne
  const footerY = pageHeight - 20
  addLine(margin, footerY - 10, pageWidth - margin, footerY - 10, colors.lightGray, 0.5)
  addText('Merci pour votre confiance', pageWidth/2, footerY - 5, { fontSize: 10, align: 'center', color: colors.gray })
  addText(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth/2, footerY, { fontSize: 8, align: 'center', color: colors.gray })
  
  return doc
}

export const downloadPDF = (documentData, type = 'quote', shopInfo = null) => {
  const pdfGenerator = type === 'quote' ? generateQuotePDF : generateInvoicePDF
  const doc = pdfGenerator(documentData, shopInfo)
  
  // Nom du fichier
  const fileName = `${type === 'quote' ? 'Devis' : 'Facture'}_${documentData.number}_${new Date().toISOString().split('T')[0]}.pdf`
  
  // Télécharger le PDF
  doc.save(fileName)
  
  return { success: true, filename: fileName }
}