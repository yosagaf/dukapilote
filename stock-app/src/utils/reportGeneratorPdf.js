import jsPDF from 'jspdf'
import { SalesStorage } from './salesStorage'
import { TransferStorage } from './transferStorage'

// Générateur de rapports PDF avec jsPDF
export const ReportGeneratorPDF = {
  // Générer un rapport PDF de ventes avec jsPDF
  generateSalesPDFReport: (salesData, period = 'all', shopName = '') => {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    let yPosition = margin

    // Configuration des couleurs
    const colors = {
      primary: '#4F46E5',
      secondary: '#10B981',
      dark: '#1F2937',
      gray: '#6B7280',
      lightGray: '#F3F4F6'
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

    // Header avec design professionnel
    addRect(0, 0, pageWidth, 50, colors.lightGray)
    addText('RAPPORT DE VENTES', pageWidth/2, 25, { fontSize: 20, fontStyle: 'bold', color: colors.primary, align: 'center' })
    addText(shopName || 'Magasin', pageWidth/2, 35, { fontSize: 14, color: colors.gray, align: 'center' })
    addText(`Période: ${period === 'all' ? 'Toutes les ventes' : period}`, pageWidth/2, 42, { fontSize: 12, color: colors.gray, align: 'center' })
    
    yPosition = 60

    // Statistiques
    const stats = SalesStorage.getSalesStats('', salesData)
    const exportData = SalesStorage.exportSalesData(salesData, 'pdf')
    
    // Cartes de statistiques
    const statCards = [
      { title: 'Total Ventes', value: stats.allTime.count, unit: 'ventes' },
      { title: 'Chiffre d\'Affaires', value: stats.allTime.total, unit: 'KMF' },
      { title: 'Panier Moyen', value: stats.allTime.count > 0 ? (stats.allTime.total / stats.allTime.count) : 0, unit: 'KMF' }
    ]

    statCards.forEach((card, index) => {
      const cardX = margin + (index * 55)
      addRect(cardX, yPosition, 50, 25, '#F8FAFC')
      addText(card.title, cardX + 25, yPosition + 8, { fontSize: 10, fontStyle: 'bold', color: colors.primary, align: 'center' })
      addText(card.value.toLocaleString('fr-FR'), cardX + 25, yPosition + 15, { fontSize: 14, fontStyle: 'bold', color: colors.dark, align: 'center' })
      addText(card.unit, cardX + 25, yPosition + 20, { fontSize: 8, color: colors.gray, align: 'center' })
    })

    yPosition += 40

    // Tableau des ventes
    addText('DÉTAIL DES VENTES', margin, yPosition, { fontSize: 14, fontStyle: 'bold', color: colors.dark })
    yPosition += 10

    // En-têtes du tableau
    const colWidths = [40, 30, 25, 25, 30]
    const headers = ['Date', 'Article', 'Qté', 'Prix U.', 'Total']
    
    addRect(margin, yPosition, pageWidth - 2*margin, 12, colors.primary)
    let colX = margin + 2
    headers.forEach((header, index) => {
      addText(header, colX, yPosition + 8, { fontSize: 10, fontStyle: 'bold', color: '#FFFFFF' })
      colX += colWidths[index]
    })
    
    yPosition += 15

    // Données des ventes
    exportData.rows.forEach((row, index) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = margin
      }
      
      // Ligne alternée
      if (index % 2 === 0) {
        addRect(margin, yPosition - 2, pageWidth - 2*margin, 10, '#F9FAFB')
      }
      
      colX = margin + 2
      row.forEach((cell, cellIndex) => {
        const cellText = cell.toString().length > 15 ? cell.toString().substring(0, 15) + '...' : cell.toString()
        addText(cellText, colX, yPosition, { fontSize: 9 })
        colX += colWidths[cellIndex]
      })
      
      yPosition += 8
    })

    yPosition += 10
    addLine(margin, yPosition, pageWidth - margin, yPosition, colors.gray, 1)
    yPosition += 10

    // Total
    addRect(margin, yPosition, pageWidth - 2*margin, 15, colors.dark)
    addText('TOTAL GÉNÉRAL', margin + 5, yPosition + 10, { fontSize: 12, fontStyle: 'bold', color: '#FFFFFF' })
    addText(`${stats.allTime.total.toLocaleString('fr-FR')} KMF`, pageWidth - margin - 5, yPosition + 10, { fontSize: 14, fontStyle: 'bold', color: colors.secondary, align: 'right' })

    // Footer
    const footerY = pageHeight - 15
    addText('Rapport généré automatiquement par DukaPilote', pageWidth/2, footerY, { fontSize: 10, align: 'center', color: colors.gray })

    return doc
  },

  // Générer un rapport PDF de transferts avec jsPDF
  generateTransferPDFReport: (transferData, period = 'all', shopName = '') => {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    let yPosition = margin

    // Configuration des couleurs
    const colors = {
      primary: '#4F46E5',
      secondary: '#10B981',
      dark: '#1F2937',
      gray: '#6B7280',
      lightGray: '#F3F4F6'
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

    // Header avec design professionnel
    addRect(0, 0, pageWidth, 50, colors.lightGray)
    addText('RAPPORT DE TRANSFERTS', pageWidth/2, 25, { fontSize: 20, fontStyle: 'bold', color: colors.primary, align: 'center' })
    addText(shopName || 'Magasin', pageWidth/2, 35, { fontSize: 14, color: colors.gray, align: 'center' })
    addText(`Période: ${period === 'all' ? 'Tous les transferts' : period}`, pageWidth/2, 42, { fontSize: 12, color: colors.gray, align: 'center' })
    
    yPosition = 60

    // Statistiques
    const exportData = TransferStorage.exportTransferData(transferData, 'pdf')
    
    // Cartes de statistiques
    const statCards = [
      { title: 'Total Transferts', value: transferData.length, unit: 'transferts' },
      { title: 'Articles Transférés', value: transferData.reduce((sum, t) => sum + t.quantity, 0), unit: 'quantité' }
    ]

    statCards.forEach((card, index) => {
      const cardX = margin + (index * 80)
      addRect(cardX, yPosition, 70, 25, '#F8FAFC')
      addText(card.title, cardX + 35, yPosition + 8, { fontSize: 10, fontStyle: 'bold', color: colors.primary, align: 'center' })
      addText(card.value.toLocaleString('fr-FR'), cardX + 35, yPosition + 15, { fontSize: 14, fontStyle: 'bold', color: colors.dark, align: 'center' })
      addText(card.unit, cardX + 35, yPosition + 20, { fontSize: 8, color: colors.gray, align: 'center' })
    })

    yPosition += 40

    // Tableau des transferts
    addText('DÉTAIL DES TRANSFERTS', margin, yPosition, { fontSize: 14, fontStyle: 'bold', color: colors.dark })
    yPosition += 10

    // En-têtes du tableau
    const colWidths = [30, 40, 30, 30, 30, 20]
    const headers = ['Date', 'Article', 'Qté', 'Depot A', 'Depot B', 'Statut']
    
    addRect(margin, yPosition, pageWidth - 2*margin, 12, colors.primary)
    let colX = margin + 2
    headers.forEach((header, index) => {
      addText(header, colX, yPosition + 8, { fontSize: 10, fontStyle: 'bold', color: '#FFFFFF' })
      colX += colWidths[index]
    })
    
    yPosition += 15

    // Données des transferts
    exportData.rows.forEach((row, index) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = margin
      }
      
      // Ligne alternée
      if (index % 2 === 0) {
        addRect(margin, yPosition - 2, pageWidth - 2*margin, 10, '#F9FAFB')
      }
      
      colX = margin + 2
      row.forEach((cell, cellIndex) => {
        const cellText = cell.toString().length > 12 ? cell.toString().substring(0, 12) + '...' : cell.toString()
        addText(cellText, colX, yPosition, { fontSize: 9 })
        colX += colWidths[cellIndex]
      })
      
      yPosition += 8
    })

    // Footer
    const footerY = pageHeight - 15
    addText('Rapport généré automatiquement par DukaPilote', pageWidth/2, footerY, { fontSize: 10, align: 'center', color: colors.gray })

    return doc
  }
}
