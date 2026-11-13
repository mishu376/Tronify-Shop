import type { CategoryId, Language, OrderStatus } from '../types';

export const CATEGORY_LABELS: Record<CategoryId, { en: string; bn: string }> = {
  'smart-watches': { en: 'Smart Watches', bn: 'স্মার্টওয়াচ' },
  earbuds: { en: 'Earbuds', bn: 'ইয়ারবাডস' },
  headphones: { en: 'Headphones', bn: 'হেডফোন' },
  'smart-gadgets': { en: 'Smart Gadgets', bn: 'স্মার্ট গ্যাজেট' },
  accessories: { en: 'Electronics Accessories', bn: 'ইলেকট্রনিক্স অ্যাক্সেসরিজ' },
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, { en: string; bn: string }> = {
  Pending: { en: 'Pending', bn: 'পেন্ডিং' },
  Confirmed: { en: 'Confirmed', bn: 'নিশ্চিত' },
  Processing: { en: 'Processing', bn: 'প্রস্তুত হচ্ছে' },
  Shipped: { en: 'Shipped', bn: 'পাঠানো হয়েছে' },
  Delivered: { en: 'Delivered', bn: 'ডেলিভারি সম্পন্ন' },
  Cancelled: { en: 'Cancelled', bn: 'বাতিল' },
};

export const UI_COPY: Record<Language, {
  navShop: string;
  navCategories: string;
  navTrack: string;
  navSupport: string;
  navAdmin: string;
  cart: string;
  allCategories: string;
  searchPlaceholder: string;
  sortFeatured: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
  sortDiscount: string;
  inStock: string;
  lowStock: string;
  outOfStock: string;
  addToCart: string;
  buyNowCod: string;
  viewDetails: string;
  off: string;
  featuredLabel: string;
  catalogTitle: string;
  catalogSubtitle: string;
  noProductsFound: string;
  resetFilters: string;
  valueCodTitle: string;
  valueCodDesc: string;
  valueWarrantyTitle: string;
  valueWarrantyDesc: string;
  valueAuthenticTitle: string;
  valueAuthenticDesc: string;
  valueSupportTitle: string;
  valueSupportDesc: string;
  backToShop: string;
  specifications: string;
  quantity: string;
  askWhatsapp: string;
  yourCart: string;
  emptyCart: string;
  continueShopping: string;
  subtotal: string;
  deliveryDhaka: string;
  deliveryOutside: string;
  freeDeliveryApplied: string;
  proceedCheckout: string;
  checkoutTitle: string;
  customerName: string;
  phoneLabel: string;
  emailOptional: string;
  districtLabel: string;
  selectDistrict: string;
  addressLabel: string;
  noteOptional: string;
  paymentCodBadge: string;
  paymentCodDesc: string;
  deliveryCharge: string;
  totalPayable: string;
  placeOrderCod: string;
  placingOrder: string;
  orderConfirmedTitle: string;
  orderConfirmedSubtitle: string;
  orderIdLabel: string;
  sendWhatsappOrder: string;
  trackThisOrder: string;
  trackOrderTitle: string;
  trackOrderSubtitle: string;
  enterOrderNumber: string;
  enterPhone: string;
  checkStatus: string;
  supportTitle: string;
  supportSubtitle: string;
  whatsappBtn: string;
  facebookBtn: string;
  emailAdminBtn: string;
  footerRights: string;
  setupGuideLink: string;
}> = {
  en: {
    navShop: 'Store',
    navCategories: 'Categories',
    navTrack: 'Track Order',
    navSupport: 'Support',
    navAdmin: 'Admin',
    cart: 'Bag',
    allCategories: 'All Tech',
    searchPlaceholder: 'Search smart watches, earbuds, chargers...',
    sortFeatured: 'Featured',
    sortPriceAsc: 'Price: Low to High',
    sortPriceDesc: 'Price: High to Low',
    sortDiscount: 'Highest Discount',
    inStock: 'In Stock',
    lowStock: 'Low Stock',
    outOfStock: 'Out of Stock',
    addToCart: 'Add to Bag',
    buyNowCod: 'Buy Now (COD)',
    viewDetails: 'View Details',
    off: 'OFF',
    featuredLabel: 'Featured',
    catalogTitle: 'Curated Electronics Catalog',
    catalogSubtitle: 'Tested for durability, battery endurance, and everyday reliability across Bangladesh.',
    noProductsFound: 'No products match your search or category filter.',
    resetFilters: 'Reset Filters',
    valueCodTitle: '64-District Cash on Delivery',
    valueCodDesc: 'Pay in cash when your parcel arrives anywhere in Bangladesh.',
    valueWarrantyTitle: 'Official Replacement Warranty',
    valueWarrantyDesc: 'Hassle-free 6 to 18 months verified hardware coverage.',
    valueAuthenticTitle: '100% Authentic Electronics',
    valueAuthenticDesc: 'Quality-inspected original gadgets with sealed packaging.',
    valueSupportTitle: 'Direct WhatsApp & Facebook Desk',
    valueSupportDesc: 'Fast human assistance before and after every order.',
    backToShop: 'Back to Catalog',
    specifications: 'Technical Specifications',
    quantity: 'Quantity',
    askWhatsapp: 'Ask on WhatsApp',
    yourCart: 'Shopping Bag',
    emptyCart: 'Your shopping bag is currently empty.',
    continueShopping: 'Browse Products',
    subtotal: 'Subtotal',
    deliveryDhaka: 'Inside Dhaka Delivery',
    deliveryOutside: 'Outside Dhaka Delivery',
    freeDeliveryApplied: 'Free delivery unlocked',
    proceedCheckout: 'Checkout with Cash on Delivery',
    checkoutTitle: 'Cash on Delivery Checkout',
    customerName: 'Full Name',
    phoneLabel: 'Mobile Number (01XXXXXXXXX)',
    emailOptional: 'Email Address (Optional, for order receipt)',
    districtLabel: 'Delivery District',
    selectDistrict: 'Select District',
    addressLabel: 'Full Delivery Address (House, Road, Area / Thana)',
    noteOptional: 'Delivery Instructions (Optional)',
    paymentCodBadge: 'Cash on Delivery (COD)',
    paymentCodDesc: 'Pay cash directly to the courier rider upon inspecting your package.',
    deliveryCharge: 'Delivery Fee',
    totalPayable: 'Total Payable (COD)',
    placeOrderCod: 'Confirm Order',
    placingOrder: 'Confirming Order...',
    orderConfirmedTitle: 'Order Confirmed',
    orderConfirmedSubtitle: 'Thank you for shopping with TRONIFY SHOP. Keep your Order ID for live tracking.',
    orderIdLabel: 'Order ID',
    sendWhatsappOrder: 'Send Summary on WhatsApp',
    trackThisOrder: 'Track Order Status',
    trackOrderTitle: 'Track Your Order',
    trackOrderSubtitle: 'Enter your TRONIFY Order ID and mobile number to check live dispatch progress.',
    enterOrderNumber: 'Order ID (e.g. TRN-20261113-1042)',
    enterPhone: 'Mobile Number (e.g. 01712345678)',
    checkStatus: 'Check Status',
    supportTitle: 'Customer Support & Channels',
    supportSubtitle: 'Need help choosing gear or tracking a parcel? Reach our Dhaka team directly.',
    whatsappBtn: 'Chat on WhatsApp',
    facebookBtn: 'Visit Facebook Page',
    emailAdminBtn: 'Email Store Support',
    footerRights: 'TRONIFY SHOP · Dhaka, Bangladesh',
    setupGuideLink: 'Deployment & Firebase Guide',
  },
  bn: {
    navShop: 'স্টোর',
    navCategories: 'ক্যাটাগরি',
    navTrack: 'অর্ডার ট্র্যাক',
    navSupport: 'সাপোর্ট',
    navAdmin: 'অ্যাডমিন',
    cart: 'ব্যাগ',
    allCategories: 'সব পণ্য',
    searchPlaceholder: 'স্মার্টওয়াচ, ইয়ারবাডস বা চার্জার খুঁজুন...',
    sortFeatured: 'জনপ্রিয়',
    sortPriceAsc: 'দাম: কম থেকে বেশি',
    sortPriceDesc: 'দাম: বেশি থেকে কম',
    sortDiscount: 'সর্বোচ্চ ছাড়',
    inStock: 'স্টকে আছে',
    lowStock: 'সীমিত স্টক',
    outOfStock: 'স্টক শেষ',
    addToCart: 'ব্যাগে যোগ করুন',
    buyNowCod: 'অর্ডার করুন (COD)',
    viewDetails: 'বিস্তারিত দেখুন',
    off: 'ছাড়',
    featuredLabel: 'ফিচার্ড',
    catalogTitle: 'নির্বাচিত ইলেকট্রনিক্স কালেকশন',
    catalogSubtitle: 'বাংলাদেশ জুড়ে দৈনন্দিন ব্যবহারের জন্য পরীক্ষিত এবং আসল গ্যাজেট।',
    noProductsFound: 'আপনার খোঁজা তথ্য অনুযায়ী কোনো পণ্য পাওয়া যায়নি।',
    resetFilters: 'ফিল্টার রিসেট করুন',
    valueCodTitle: '৬৪ জেলায় ক্যাশ অন ডেলিভারি',
    valueCodDesc: 'সারা বাংলাদেশের যেকোনো প্রান্তে পণ্য হাতে পেয়ে টাকা পরিশোধ করুন।',
    valueWarrantyTitle: 'অফিসিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি',
    valueWarrantyDesc: '৬ থেকে ১৮ মাসের নির্ভরযোগ্য হার্ডওয়্যার ওয়ারেন্টি সুবিধা।',
    valueAuthenticTitle: '১০০% আসল ও যাচাইকৃত পণ্য',
    valueAuthenticDesc: 'সিল করা প্যাকেজিং এবং গুণগত মান পরীক্ষা করে ডেলিভারি।',
    valueSupportTitle: 'সরাসরি হোয়াটসঅ্যাপ ও ফেসবুক সাপোর্ট',
    valueSupportDesc: 'অর্ডারের আগে ও পরে দ্রুত মানবিক সহায়তা।',
    backToShop: 'স্টোরে ফিরে যান',
    specifications: 'টেকনিক্যাল স্পেসিফিকেশন',
    quantity: 'পরিমাণ',
    askWhatsapp: 'হোয়াটসঅ্যাপে জিজ্ঞাসা করুন',
    yourCart: 'শপিং ব্যাগ',
    emptyCart: 'আপনার শপিং ব্যাগ বর্তমানে খালি।',
    continueShopping: 'পণ্য দেখুন',
    subtotal: 'সাবটোটাল',
    deliveryDhaka: 'ঢাকার ভেতরে ডেলিভারি',
    deliveryOutside: 'ঢাকার বাইরে ডেলিভারি',
    freeDeliveryApplied: 'ফ্রি ডেলিভারি প্রযোজ্য',
    proceedCheckout: 'ক্যাশ অন ডেলিভারিতে চেকআউট করুন',
    checkoutTitle: 'ক্যাশ অন ডেলিভারি চেকআউট',
    customerName: 'আপনার পুরো নাম',
    phoneLabel: 'মোবাইল নম্বর (01XXXXXXXXX)',
    emailOptional: 'ইমেইল ঠিকানা (ঐচ্ছিক, রসিদের জন্য)',
    districtLabel: 'ডেলিভারি জেলা',
    selectDistrict: 'জেলা নির্বাচন করুন',
    addressLabel: 'সম্পূর্ণ ডেলিভারি ঠিকানা (বাসা, রোড, এলাকা / থানা)',
    noteOptional: 'অতিরিক্ত নির্দেশনা (ঐচ্ছিক)',
    paymentCodBadge: 'ক্যাশ অন ডেলিভারি (COD)',
    paymentCodDesc: 'পণ্য হাতে পেয়ে কুরিয়ার ডেলিভারিম্যানের কাছে নগদ টাকা পরিশোধ করুন।',
    deliveryCharge: 'ডেলিভারি চার্জ',
    totalPayable: 'মোট পরিশোধযোগ্য (COD)',
    placeOrderCod: 'অর্ডার কনফার্ম করুন',
    placingOrder: 'অর্ডার নিশ্চিত হচ্ছে...',
    orderConfirmedTitle: 'অর্ডার সফলভাবে নিশ্চিত হয়েছে',
    orderConfirmedSubtitle: 'TRONIFY SHOP থেকে কেনাকাটার জন্য ধন্যবাদ। লাইভ ট্র্যাকিংয়ের জন্য অর্ডার আইডিটি সংরক্ষণ করুন।',
    orderIdLabel: 'অর্ডার আইডি',
    sendWhatsappOrder: 'হোয়াটসঅ্যাপে অর্ডার সামারি পাঠান',
    trackThisOrder: 'অর্ডার স্ট্যাটাস ট্র্যাক করুন',
    trackOrderTitle: 'আপনার অর্ডার ট্র্যাক করুন',
    trackOrderSubtitle: 'অর্ডার আইডি এবং মোবাইল নম্বর দিয়ে আপনার পার্সেলের বর্তমান অবস্থা দেখুন।',
    enterOrderNumber: 'অর্ডার আইডি (যেমন: TRN-20261113-1042)',
    enterPhone: 'মোবাইল নম্বর (যেমন: 01712345678)',
    checkStatus: 'স্ট্যাটাস দেখুন',
    supportTitle: 'কাস্টমার সাপোর্ট ও যোগাযোগ',
    supportSubtitle: 'পণ্য বাছাই বা ডেলিভারি সংক্রান্ত যেকোনো সাহায্যের জন্য আমাদের ঢাকা টিমের সাথে যোগাযোগ করুন।',
    whatsappBtn: 'হোয়াটসঅ্যাপে চ্যাট করুন',
    facebookBtn: 'ফেসবুক পেজ দেখুন',
    emailAdminBtn: 'ইমেইল সাপোর্ট',
    footerRights: 'TRONIFY SHOP · ঢাকা, বাংলাদেশ',
    setupGuideLink: 'ফায়ারবেস ও হোস্টিং গাইড',
  },
};

export function formatBDT(amount: number): string {
  return `৳${Math.round(amount).toLocaleString('en-IN')}`;
}
