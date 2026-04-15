import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { OrderDTO } from '@/types';

// Enregistrement d'une police pour un look plus moderne
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
    color: '#333',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 20,
  },
  logoSection: {
    flexDirection: 'column',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: -1,
  },
  logoAccent: {
    color: '#3B82F6', // Couleur primaire (bleu ShopFlow)
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
    textTransform: 'uppercase',
    color: '#999999',
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  infoBox: {
    width: '45%',
  },
  label: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#999999',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    fontSize: 10,
    fontWeight: 'normal',
    marginBottom: 2,
  },
  table: {
    marginTop: 20,
    width: 'auto',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    padding: 8,
  },
  colDesc: { width: '50%' },
  colQty: { width: '15%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  
  summarySection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  summaryBox: {
    width: '40%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#3B82F6',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
    fontSize: 8,
    color: '#999999',
  },
});

interface InvoicePDFProps {
  order: OrderDTO;
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ order }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <Text style={styles.logo}>
            SHOP<Text style={styles.logoAccent}>FLOW</Text>
          </Text>
          <Text style={{ fontSize: 8, color: '#666', marginTop: 4 }}>
            Votre partenaire e-commerce de confiance
          </Text>
        </View>
        <View>
          <Text style={styles.invoiceTitle}>Facture</Text>
          <Text style={{ textAlign: 'right', marginTop: 4 }}>N° {order.orderNumber || order.id}</Text>
          <Text style={{ textAlign: 'right', color: '#666' }}>
            Date : {new Date(order.createdAt).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </View>

      {/* Info Sections */}
      <View style={styles.infoSection}>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Facturé à</Text>
          <Text style={styles.value}>{order.customerEmail}</Text>
          <Text style={styles.value}>Client ShopFlow ID: #{order.id}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Détails du paiement</Text>
          <Text style={styles.value}>Statut : {order.paymentStatus}</Text>
          <Text style={styles.value}>Référence : {order.orderNumber}</Text>
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Description du produit</Text>
          <Text style={styles.colQty}>Qté</Text>
          <Text style={styles.colPrice}>Prix Unitaire</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>
        {order.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.colDesc}>{item.productName}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>{item.unitPrice.toFixed(2)}€</Text>
            <Text style={styles.colTotal}>{(item.unitPrice * item.quantity).toFixed(2)}€</Text>
          </View>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={{ color: '#666' }}>Sous-total</Text>
            <Text style={{ fontWeight: 'bold' }}>{order.subtotalAmount.toFixed(2)}€</Text>
          </View>
          {order.discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={{ color: '#10B981' }}>Réduction</Text>
              <Text style={{ color: '#10B981', fontWeight: 'bold' }}>-{order.discountAmount.toFixed(2)}€</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={{ color: '#666' }}>Frais de livraison</Text>
            <Text style={{ fontWeight: 'bold' }}>{order.shippingFee.toFixed(2)}€</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ color: '#666' }}>Taxes (TVA 20%)</Text>
            <Text style={{ fontWeight: 'bold' }}>{order.taxAmount.toFixed(2)}€</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total TTC</Text>
            <Text style={styles.totalValue}>{order.totalAmount.toFixed(2)}€</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Merci pour votre confiance sur ShopFlow !</Text>
        <Text style={{ marginTop: 4 }}>
          ShopFlow Inc. - 123 Business Street, 75000 Paris, France
        </Text>
        <Text>S.A.S au capital de 1 000 000€ - RCS Paris B 123 456 789</Text>
      </View>
    </Page>
  </Document>
);
