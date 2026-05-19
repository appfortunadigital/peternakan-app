import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';

const { width } = Dimensions.get('window');
const BASE_URL = 'https://script.google.com/macros/s/AKfycbw6k5Gyt9PlAhAiuSlIN_PozcG7PykCZ43a7U0IWMt1DV6shGdkUzORQxIhGkrXwpY/exec';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    try {
      const user = await AsyncStorage.getItem('userData');
      if (user) setCurrentUser(JSON.parse(user));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Memuat...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} />;
  }

  if (currentUser.role === 'admin') {
    return <AdminDashboard user={currentUser} onLogout={() => setCurrentUser(null)} />;
  }

  return <UserDashboard user={currentUser} onLogout={() => setCurrentUser(null)} />;
}

// ==================== LOGIN SCREEN ====================
const LoginScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Isi email dan password');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });
      const data = await res.json();
      if (data.success) {
        await AsyncStorage.setItem('userData', JSON.stringify(data));
        onLogin(data);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Koneksi gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!nama || !email || !noHp || !password) {
      Alert.alert('Error', 'Isi semua field');
      return;
    }
    if (password !== confirmPass) {
      Alert.alert('Error', 'Password tidak cocok');
      return;
    }
    if (password.length < 4) {
      Alert.alert('Error', 'Password minimal 4 karakter');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', email, nama, noHp, password }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Sukses', data.message);
        setIsLogin(true);
        setEmail(email);
        setPassword('');
        setConfirmPass('');
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Koneksi gagal');
    } finally {
      setLoading(false);
    }
  };

  const sendResetCode = async () => {
    if (!resetEmail) {
      Alert.alert('Error', 'Masukkan email');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sendResetCode', email: resetEmail }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Sukses', data.message);
        setResetStep(2);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Koneksi gagal');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert('Error', 'Masukkan kode OTP 6 digit');
      return;
    }
    if (!newPassword || !confirmNewPassword) {
      Alert.alert('Error', 'Isi password baru dan konfirmasi');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'Password tidak cocok');
      return;
    }
    if (newPassword.length < 4) {
      Alert.alert('Error', 'Password minimal 4 karakter');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resetPassword', email: resetEmail, otpCode, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Sukses', data.message);
        setResetMode(false);
        setResetStep(1);
        setResetEmail('');
        setOtpCode('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Koneksi gagal');
    } finally {
      setLoading(false);
    }
  };

  if (resetMode) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🔐</Text>
            <Text style={styles.logoTitle}>Reset Password</Text>
          </View>
          <View style={styles.formCard}>
            {resetStep === 1 ? (
              <>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.btnPrimary} onPress={sendResetCode} disabled={loading}>
                  <Text style={styles.btnText}>{loading ? 'Mengirim...' : 'Kirim Kode OTP'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setResetMode(false)}>
                  <Text style={styles.linkText}>Kembali ke Login</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>Kode OTP</Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="000000"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                />
                <Text style={styles.label}>Password Baru</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Minimal 4 karakter"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon} 
                    onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Text style={styles.eyeIconText}>{showNewPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.label}>Konfirmasi Password Baru</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Ulangi password"
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    secureTextEntry={!showConfirmNewPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon} 
                    onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
                    <Text style={styles.eyeIconText}>{showConfirmNewPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.btnPrimary} onPress={resetPassword} disabled={loading}>
                  <Text style={styles.btnText}>{loading ? 'Memproses...' : 'Reset Password'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setResetStep(1); setResetEmail(''); }}>
                  <Text style={styles.linkText}>Kirim Ulang Kode</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🐔</Text>
          <Text style={styles.logoTitle}>Peternakan Ayam Kampung</Text>
          <Text style={styles.logoSubtitle}>Telur • Ayam • DOC • Sayuran</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.tabBar}>
            <TouchableOpacity style={[styles.tab, isLogin && styles.activeTab]} onPress={() => setIsLogin(true)}>
              <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Masuk</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, !isLogin && styles.activeTab]} onPress={() => setIsLogin(false)}>
              <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Daftar</Text>
            </TouchableOpacity>
          </View>

          {isLogin ? (
            <>
              <Text style={styles.label}>Email</Text>
              <TextInput 
                style={styles.input} 
                placeholder="email@example.com" 
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address" 
                autoCapitalize="none" 
              />
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.eyeIconText}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={loading}>
                <Text style={styles.btnText}>{loading ? 'Memproses...' : 'Masuk'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setResetMode(true)}>
                <Text style={styles.linkText}>Lupa Password?</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Nama Lengkap</Text>
              <TextInput style={styles.input} placeholder="Nama" value={nama} onChangeText={setNama} />
              <Text style={styles.label}>Email</Text>
              <TextInput 
                style={styles.input} 
                placeholder="email@example.com" 
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address" 
                autoCapitalize="none" 
              />
              <Text style={styles.label}>No. HP</Text>
              <TextInput 
                style={styles.input} 
                placeholder="08123456789" 
                value={noHp} 
                onChangeText={setNoHp} 
                keyboardType="phone-pad" 
              />
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Minimal 4 karakter"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.eyeIconText}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.label}>Konfirmasi Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Ulangi password"
                  value={confirmPass}
                  onChangeText={setConfirmPass}
                  secureTextEntry={!showConfirmPass}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowConfirmPass(!showConfirmPass)}>
                  <Text style={styles.eyeIconText}>{showConfirmPass ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleRegister} disabled={loading}>
                <Text style={styles.btnText}>{loading ? 'Memproses...' : 'Daftar'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ==================== USER DASHBOARD ====================
const UserDashboard = ({ user, onLogout }) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [filterCategory, setFilterCategory] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: null, lng: null, alamat: '' });

  useEffect(() => {
    loadProducts();
    loadCart();
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') loadOrders();
  }, [activeTab]);

  const loadProducts = async () => {
    try {
      const res = await fetch(`${BASE_URL}?action=getProducts`);
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat produk');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (error) {}
  };

  const saveCart = async (newCart) => {
    setCart(newCart);
    await AsyncStorage.setItem('cart', JSON.stringify(newCart));
  };

  const loadOrders = async () => {
    try {
      const res = await fetch(`${BASE_URL}?action=getUserOrders&email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      setOrders(data);
    } catch (error) {}
  };

  const updateCart = (product, delta) => {
    const existing = cart.find(i => i.id === product.id);
    const newQty = (existing?.qty || 0) + delta;
    if (newQty <= 0) {
      saveCart(cart.filter(i => i.id !== product.id));
    } else if (newQty <= product.stok) {
      if (existing) {
        saveCart(cart.map(i => i.id === product.id ? { ...i, qty: newQty } : i));
      } else {
        saveCart([...cart, { ...product, qty: newQty }]);
      }
    } else {
      Alert.alert('Info', `Stok hanya ${product.stok} ${product.satuan}`);
    }
  };

  const getDiscountedPrice = (harga, diskon) => harga - (harga * diskon / 100);
  const formatRupiah = (angka) => 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin ditolak', 'Aktifkan izin lokasi');
      return null;
    }
    const location = await Location.getCurrentPositionAsync({});
    return { lat: location.coords.latitude, lng: location.coords.longitude };
  };

  const submitOrder = async (orderDetails) => {
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveOrder',
          orderData: orderDetails,
          userEmail: user.email,
          userName: user.nama,
          userNoHp: user.noHp,
          userLocation,
        }),
      });
      const result = await res.json();
      if (result.success) {
        Alert.alert('Sukses', '✓ Pesanan berhasil! Stok telah diperbarui.');
        setCart([]);
        await AsyncStorage.removeItem('cart');
        setShowCheckout(false);
        loadProducts();
        if (result.waNumber) {
          const waMsg = `Halo Admin, saya ${user.nama} (${user.noHp}) telah memesan:\n${orderDetails.produkDipesan}\nTotal: ${formatRupiah(orderDetails.estimasiTotal)}\nID: ${result.orderId}`;
          Linking.openURL(`https://wa.me/${result.waNumber}?text=${encodeURIComponent(waMsg)}`);
        }
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal mengirim pesanan');
    }
  };

  const deleteOrder = async (orderId, status) => {
    let pesan = '';
    if (status === 'pending') {
      pesan = 'Batalkan pesanan yang masih PENDING? Stok akan dikembalikan.';
    } else if (status === 'proses') {
      pesan = 'Batalkan pesanan yang sedang diproses? Stok akan dikembalikan.';
    } else {
      pesan = 'Hapus riwayat pesanan yang sudah selesai?';
    }
    
    Alert.alert('Konfirmasi', pesan, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Ya, Hapus',
        style: 'destructive',
        onPress: async () => {
          const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'deleteOrder', orderId, userEmail: user.email, userRole: user.role }),
          });
          const data = await res.json();
          Alert.alert('Info', data.message);
          if (data.success) {
            loadOrders();
            loadProducts();
          }
        },
      },
    ]);
  };

  const filteredProducts = products.filter(p => {
    const matchKategori = filterCategory === 'semua' || p.kategori === filterCategory;
    const matchSearch = p.nama.toLowerCase().includes(searchQuery.toLowerCase());
    return matchKategori && matchSearch;
  });

  const totalCartItems = cart.reduce((s, i) => s + i.qty, 0);

  const renderProduct = ({ item }) => (
    <ProductCard 
      item={item} 
      cart={cart} 
      updateCart={updateCart} 
      formatRupiah={formatRupiah} 
      getDiscountedPrice={getDiscountedPrice} 
    />
  );

  const renderOrder = ({ item }) => {
    const getStatusStyle = () => {
      if (item.status === 'pending') return styles.statusPending;
      if (item.status === 'proses') return styles.statusProses;
      return styles.statusSelesai;
    };
    const getStatusText = () => {
      if (item.status === 'pending') return 'Pending';
      if (item.status === 'proses') return 'Proses';
      return 'Selesai';
    };

    return (
      <View style={styles.orderCard}>
        <Text style={styles.orderId}>{item.id}</Text>
        <Text style={styles.orderProduct} numberOfLines={2}>{item.produk}</Text>
        <Text style={styles.orderTotal}>{formatRupiah(item.total)}</Text>
        <View style={[styles.statusBadge, getStatusStyle()]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
        <View style={styles.orderActions}>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteOrder(item.id, item.status)}>
            <Text style={styles.deleteBtnText}>
              {item.status === 'pending' ? '❌ Batalkan' : '🗑️ Hapus'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🐔 Peternakan Ayam Kampung</Text>
        <Text style={styles.headerSubtitle}>Halo, {user.nama}</Text>
      </View>

      {activeTab === 'home' ? (
        <>
          <View style={styles.searchBar}>
            <TextInput 
              style={styles.searchInput} 
              placeholder="🔍 Cari produk..." 
              value={searchQuery} 
              onChangeText={setSearchQuery} 
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
            <TouchableOpacity style={[styles.chip, filterCategory === 'semua' && styles.chipActive]} onPress={() => setFilterCategory('semua')}>
              <Text style={[styles.chipText, filterCategory === 'semua' && styles.chipTextActive]}>Semua</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, filterCategory === 'telur_doc' && styles.chipActive]} onPress={() => setFilterCategory('telur_doc')}>
              <Text style={[styles.chipText, filterCategory === 'telur_doc' && styles.chipTextActive]}>🥚 Telur & DOC</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, filterCategory === 'ayam' && styles.chipActive]} onPress={() => setFilterCategory('ayam')}>
              <Text style={[styles.chipText, filterCategory === 'ayam' && styles.chipTextActive]}>🍗 Ayam</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, filterCategory === 'sayur' && styles.chipActive]} onPress={() => setFilterCategory('sayur')}>
              <Text style={[styles.chipText, filterCategory === 'sayur' && styles.chipTextActive]}>🌿 Sayuran</Text>
            </TouchableOpacity>
          </ScrollView>
          <FlatList 
            data={filteredProducts} 
            renderItem={renderProduct} 
            keyExtractor={item => item.id.toString()} 
            numColumns={2} 
            columnWrapperStyle={styles.productRow} 
            showsVerticalScrollIndicator={false} 
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadProducts} />} 
            ListEmptyComponent={<View style={styles.emptyState}><Text>Tidak ada produk</Text></View>} 
          />
        </>
      ) : (
        <FlatList 
          data={orders} 
          renderItem={renderOrder} 
          keyExtractor={item => item.id} 
          showsVerticalScrollIndicator={false} 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadOrders} />} 
          ListEmptyComponent={<View style={styles.emptyState}><Text>Belum ada pesanan</Text></View>} 
        />
      )}

      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, activeTab === 'home' && styles.navItemActive]} onPress={() => setActiveTab('home')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>Beranda</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, activeTab === 'orders' && styles.navItemActive]} onPress={() => setActiveTab('orders')}>
          <Text style={styles.navIcon}>📋</Text>
          <Text style={[styles.navText, activeTab === 'orders' && styles.navTextActive]}>Pesanan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => cart.length === 0 ? Alert.alert('Info', 'Keranjang kosong') : setShowCheckout(true)}>
          <View>
            <Text style={styles.navIcon}>🛒</Text>
            {totalCartItems > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{totalCartItems}</Text></View>}
          </View>
          <Text style={styles.navText}>Keranjang</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={onLogout}>
          <Text style={styles.navIcon}>🚪</Text>
          <Text style={styles.navText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      <CheckoutModal 
        visible={showCheckout} 
        onClose={() => setShowCheckout(false)} 
        cart={cart} 
        user={user} 
        onSubmit={submitOrder} 
        getLocation={getLocation} 
        setUserLocation={setUserLocation} 
        formatRupiah={formatRupiah} 
        getDiscountedPrice={getDiscountedPrice} 
      />
    </SafeAreaView>
  );
};

// ==================== PRODUCT CARD COMPONENT dengan ZOOM ====================
const ProductCard = ({ item, cart, updateCart, formatRupiah, getDiscountedPrice }) => {
  const [showZoom, setShowZoom] = useState(false);
  const cartItem = cart.find(c => c.id === item.id);
  const qty = cartItem?.qty || 0;
  const finalPrice = getDiscountedPrice(item.harga, item.diskon);
  const outOfStock = item.stok === 0;

  return (
    <>
      <View style={styles.productCard}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => setShowZoom(true)}>
          <Image source={{ uri: item.gambar || 'https://via.placeholder.com/300' }} style={styles.productImage} />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>{item.nama}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.productPrice}>{formatRupiah(finalPrice)}</Text>
              <Text style={styles.productUnit}>/{item.satuan}</Text>
              {item.diskon > 0 && <Text style={styles.discountBadge}>-{item.diskon}%</Text>}
            </View>
            <Text style={styles.stockInfo}>{outOfStock ? '❌ Habis' : `📦 ${item.stok}`}</Text>
            
            <View style={styles.qtyControl}>
              <View style={styles.qtyButtons}>
                <TouchableOpacity 
                  style={[styles.qtyBtn, (qty === 0 || outOfStock) && styles.qtyBtnDisabled]} 
                  onPress={() => updateCart(item, -1)} 
                  disabled={qty === 0 || outOfStock}>
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{qty}</Text>
                <TouchableOpacity 
                  style={[styles.qtyBtn, (outOfStock || qty >= item.stok) && styles.qtyBtnDisabled]} 
                  onPress={() => updateCart(item, 1)} 
                  disabled={outOfStock || qty >= item.stok}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={[styles.addToCartBtn, outOfStock && styles.addToCartDisabled]} 
                onPress={() => updateCart(item, 1)} 
                disabled={outOfStock}>
                <Text style={styles.addToCartText}>+ Keranjang</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* MODAL ZOOM */}
      <Modal visible={showZoom} transparent animationType="fade">
        <View style={styles.zoomOverlay}>
          <View style={styles.zoomContent}>
            <TouchableOpacity style={styles.zoomCloseBtn} onPress={() => setShowZoom(false)}>
              <Text style={styles.zoomCloseText}>✕</Text>
            </TouchableOpacity>
            
            <Image source={{ uri: item.gambar || 'https://via.placeholder.com/300' }} style={styles.zoomImage} />
            
            <Text style={styles.zoomName}>{item.nama}</Text>
            <Text style={styles.zoomDeskripsi}>{item.deskripsi || 'Produk berkualitas dari Peternakan Ayam Kampung'}</Text>
            
            <View style={styles.zoomPriceRow}>
              <Text style={styles.zoomPrice}>{formatRupiah(finalPrice)}</Text>
              <Text style={styles.zoomUnit}>/{item.satuan}</Text>
              {item.diskon > 0 && (
                <>
                  <Text style={styles.zoomOriginalPrice}>{formatRupiah(item.harga)}</Text>
                  <Text style={styles.zoomDiscount}>-{item.diskon}%</Text>
                </>
              )}
            </View>
            
            <Text style={[styles.zoomStock, outOfStock && styles.zoomStockHabis]}>
              {outOfStock ? '❌ STOK HABIS' : `📦 Stok tersedia: ${item.stok} ${item.satuan}`}
            </Text>
            
            <View style={styles.zoomQtyControl}>
              <Text style={styles.zoomQtyLabel}>Jumlah Pesanan:</Text>
              <View style={styles.zoomQtyButtons}>
                <TouchableOpacity 
                  style={[styles.zoomQtyBtn, (qty === 0 || outOfStock) && styles.zoomQtyBtnDisabled]} 
                  onPress={() => { updateCart(item, -1); setShowZoom(false); }} 
                  disabled={qty === 0 || outOfStock}>
                  <Text style={styles.zoomQtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.zoomQtyValue}>{qty}</Text>
                <TouchableOpacity 
                  style={[styles.zoomQtyBtn, (outOfStock || qty >= item.stok) && styles.zoomQtyBtnDisabled]} 
                  onPress={() => { updateCart(item, 1); setShowZoom(false); }} 
                  disabled={outOfStock || qty >= item.stok}>
                  <Text style={styles.zoomQtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.zoomAddToCartBtn, outOfStock && styles.zoomAddToCartDisabled]} 
              onPress={() => { updateCart(item, 1); setShowZoom(false); Alert.alert('Info', '✓ ' + item.nama + ' ditambahkan ke keranjang'); }} 
              disabled={outOfStock}>
              <Text style={styles.zoomAddToCartText}>🛒 + Tambah ke Keranjang</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.zoomCancelBtn} onPress={() => setShowZoom(false)}>
              <Text style={styles.zoomCancelText}>Kembali</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ==================== CHECKOUT MODAL ====================
const CheckoutModal = ({ visible, onClose, cart, user, onSubmit, getLocation, setUserLocation, formatRupiah, getDiscountedPrice }) => {
  const [metode, setMetode] = useState('ambil sendiri');
  const [alamat, setAlamat] = useState('');
  const [jam, setJam] = useState('Pagi (08.00-11.00)');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [catatan, setCatatan] = useState('');
  const [layananTambahan, setLayananTambahan] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showJamPicker, setShowJamPicker] = useState(false);

  const services = ['💵 Tarik Tunai', '🪙 Menabung Emas', '💸 Transfer Dana', '🚕 Ovo/GoPay/Grab', '📱 Pulsa/Data', '⚡ Token Listrik', '💧 PDAM'];
  const jamOptions = ['Pagi (08.00-11.00)', 'Siang (13.00-15.00)', 'Sore (16.00-18.00)'];

  const total = cart.reduce((sum, item) => {
    const price = getDiscountedPrice(item.harga, item.diskon);
    return sum + (price * item.qty);
  }, 0);

  const produkDipesan = cart.map(item => `- ${item.nama}: ${item.qty} ${item.satuan}`).join('\n');

  const handleSubmit = async () => {
    if (metode === 'diantar cod' && !alamat) {
      Alert.alert('Error', 'Isi alamat lengkap!');
      return;
    }
    setSubmitting(true);
    await onSubmit({ produkDipesan, estimasiTotal: total, metode, jam, tanggal, catatan, layananTambahan });
    setSubmitting(false);
  };

  const getCurrentLocation = async () => {
    const location = await getLocation();
    if (location) {
      setUserLocation({ ...location, alamat: '' });
      setAlamat(`Lokasi: ${location.lat}, ${location.lng}`);
      Alert.alert('Sukses', 'Lokasi berhasil diambil');
    }
  };

  const toggleService = (service) => {
    if (layananTambahan.includes(service)) {
      setLayananTambahan(layananTambahan.filter(s => s !== service));
    } else {
      setLayananTambahan([...layananTambahan, service]);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📦 Detail Pemesanan</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Metode</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity style={[styles.radioOption, metode === 'ambil sendiri' && styles.radioSelected]} onPress={() => setMetode('ambil sendiri')}>
                <Text style={styles.radioText}>🏪 Ambil Sendiri</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.radioOption, metode === 'diantar cod' && styles.radioSelected]} onPress={() => setMetode('diantar cod')}>
                <Text style={styles.radioText}>🚴 Diantar COD</Text>
              </TouchableOpacity>
            </View>
            {metode === 'diantar cod' && (
              <>
                <Text style={styles.label}>Alamat Lengkap</Text>
                <TextInput 
                  style={[styles.input, styles.textArea]} 
                  placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota" 
                  value={alamat} 
                  onChangeText={setAlamat} 
                  multiline 
                  numberOfLines={3} 
                />
                <TouchableOpacity style={styles.locationBtn} onPress={getCurrentLocation}>
                  <Text style={styles.locationBtnText}>📍 Gunakan Lokasi Saya</Text>
                </TouchableOpacity>
              </>
            )}
            <Text style={styles.label}>Jam</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowJamPicker(true)}>
              <Text style={styles.pickerButtonText}>{jam}</Text>
            </TouchableOpacity>

            <Modal visible={showJamPicker} transparent animationType="fade">
              <View style={styles.pickerModalOverlay}>
                <View style={styles.pickerModalContent}>
                  <Text style={styles.pickerModalTitle}>Pilih Jam</Text>
                  {jamOptions.map((option, idx) => (
                    <TouchableOpacity key={idx} style={styles.pickerOption} onPress={() => { setJam(option); setShowJamPicker(false); }}>
                      <Text style={styles.pickerOptionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={styles.pickerCancelBtn} onPress={() => setShowJamPicker(false)}>
                    <Text style={styles.pickerCancelText}>Batal</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <Text style={styles.label}>Tanggal</Text>
            <TextInput 
              style={styles.input} 
              value={tanggal} 
              onChangeText={setTanggal} 
              placeholder="YYYY-MM-DD" 
            />

            <Text style={styles.label}>Layanan Tambahan</Text>
            <View style={styles.servicesGrid}>
              {services.map((s, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.serviceOption, layananTambahan.includes(s) && styles.serviceSelected]} 
                  onPress={() => toggleService(s)}>
                  <Text style={[styles.serviceText, layananTambahan.includes(s) && styles.serviceSelectedText]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Catatan</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              placeholder="Catatan untuk pesanan..." 
              value={catatan} 
              onChangeText={setCatatan} 
              multiline 
              numberOfLines={2} 
            />

            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>Total: {formatRupiah(total)}</Text>
            </View>

            <TouchableOpacity 
              style={[styles.btnPrimary, submitting && styles.buttonDisabled]} 
              onPress={handleSubmit} 
              disabled={submitting}>
              <Text style={styles.btnText}>{submitting ? 'Menyimpan...' : '📩 Kirim Pesanan'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ==================== ADMIN DASHBOARD ====================
const AdminDashboard = ({ user, onLogout }) => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newProduct, setNewProduct] = useState({ nama: '', satuan: '', harga: '', stok: '', kategori: 'telur_doc', gambar: '', deskripsi: '' });
  const [showStatusPicker, setShowStatusPicker] = useState(null);

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    if (activeTab === 'orders') await loadOrders();
    else if (activeTab === 'products') await loadProducts();
    setLoading(false);
    setRefreshing(false);
  };

  const loadProducts = async () => {
    try {
      const res = await fetch(`${BASE_URL}?action=getProducts`);
      const data = await res.json();
      setProducts(data);
    } catch (error) { Alert.alert('Error', 'Gagal memuat produk'); }
  };

  const loadOrders = async () => {
    try {
      const res = await fetch(`${BASE_URL}?action=getAllOrders`);
      const data = await res.json();
      setOrders(data);
    } catch (error) { Alert.alert('Error', 'Gagal memuat pesanan'); }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateOrderStatus', orderId, newStatus }),
      });
      Alert.alert('Sukses', `Status diperbarui menjadi ${newStatus}`);
      loadOrders();
    } catch (error) {}
  };

  const deleteOrder = async (orderId) => {
    Alert.alert('Konfirmasi', 'Hapus pesanan ini? Stok akan dikembalikan!', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'deleteOrder', orderId, userEmail: user.email, userRole: 'admin' }),
          });
          loadOrders();
          loadProducts();
        },
      },
    ]);
  };

  const updateProduct = async (productId, field, value) => {
    await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: `updateProduct${field}`, productId, value }),
    });
    loadProducts();
  };

  const addProduct = async () => {
    if (!newProduct.nama || !newProduct.satuan || !newProduct.harga || !newProduct.stok) {
      Alert.alert('Error', 'Isi nama, satuan, harga, dan stok!');
      return;
    }
    await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addNewProduct', product: newProduct }),
    });
    Alert.alert('Sukses', 'Produk ditambahkan');
    setNewProduct({ nama: '', satuan: '', harga: '', stok: '', kategori: 'telur_doc', gambar: '', deskripsi: '' });
    loadProducts();
    setActiveTab('products');
  };

  const formatRupiah = (angka) => 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const renderOrder = ({ item }) => (
    <View style={styles.adminOrderCard}>
      <View style={styles.adminOrderHeader}>
        <Text style={styles.adminOrderId}>{item.id}</Text>
        <View style={[styles.statusBadge, item.status === 'pending' ? styles.statusPending : item.status === 'proses' ? styles.statusProses : styles.statusSelesai]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.adminOrderUser}>{item.nama || item.email}</Text>
      <Text style={styles.adminOrderPhone}>{item.noHp || '-'}</Text>
      <Text style={styles.adminOrderTotal}>{formatRupiah(item.total)}</Text>
      <Text style={styles.adminOrderAddress} numberOfLines={2}>{item.alamat || '-'}</Text>
      <View style={styles.adminOrderActions}>
        <TouchableOpacity style={styles.statusPickerBtn} onPress={() => setShowStatusPicker(item.id)}>
          <Text style={styles.statusPickerBtnText}>Ubah Status</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteOrder(item.id)}>
          <Text style={styles.deleteBtnText}>🗑️ Hapus</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showStatusPicker === item.id} transparent animationType="fade">
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Ubah Status Pesanan</Text>
            <TouchableOpacity style={styles.pickerOption} onPress={() => { updateOrderStatus(item.id, 'pending'); setShowStatusPicker(null); }}>
              <Text style={styles.pickerOptionText}>⏳ Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerOption} onPress={() => { updateOrderStatus(item.id, 'proses'); setShowStatusPicker(null); }}>
              <Text style={styles.pickerOptionText}>🔄 Proses</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerOption} onPress={() => { updateOrderStatus(item.id, 'selesai'); setShowStatusPicker(null); }}>
              <Text style={styles.pickerOptionText}>✅ Selesai</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerCancelBtn} onPress={() => setShowStatusPicker(null)}>
              <Text style={styles.pickerCancelText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderProduct = ({ item }) => (
    <View style={styles.adminProductCard}>
      <Text style={styles.adminProductName}>{item.nama}</Text>
      <View style={styles.adminProductFields}>
        <View style={styles.adminField}>
          <Text style={styles.adminFieldLabel}>Harga</Text>
          <TextInput 
            style={styles.adminFieldInput} 
            value={String(item.harga)} 
            onChangeText={(v) => updateProduct(item.id, 'Price', v)} 
            keyboardType="numeric" 
          />
        </View>
        <View style={styles.adminField}>
          <Text style={styles.adminFieldLabel}>Stok</Text>
          <TextInput 
            style={styles.adminFieldInput} 
            value={String(item.stok)} 
            onChangeText={(v) => updateProduct(item.id, 'Stock', v)} 
            keyboardType="numeric" 
          />
        </View>
        <View style={styles.adminField}>
          <Text style={styles.adminFieldLabel}>Diskon</Text>
          <TextInput 
            style={styles.adminFieldInput} 
            value={String(item.diskon)} 
            onChangeText={(v) => updateProduct(item.id, 'Discount', v)} 
            keyboardType="numeric" 
          />
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👨‍🌾 Admin Panel</Text>
        <Text style={styles.headerSubtitle}>Halo, {user.nama}</Text>
      </View>
      <View style={styles.adminTabs}>
        <TouchableOpacity style={[styles.adminTab, activeTab === 'orders' && styles.adminTabActive]} onPress={() => setActiveTab('orders')}>
          <Text style={[styles.adminTabText, activeTab === 'orders' && styles.adminTabTextActive]}>📦 Pesanan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.adminTab, activeTab === 'products' && styles.adminTabActive]} onPress={() => setActiveTab('products')}>
          <Text style={[styles.adminTabText, activeTab === 'products' && styles.adminTabTextActive]}>🛍️ Produk</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.adminTab, activeTab === 'addProduct' && styles.adminTabActive]} onPress={() => setActiveTab('addProduct')}>
          <Text style={[styles.adminTabText, activeTab === 'addProduct' && styles.adminTabTextActive]}>➕ Tambah</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.adminTab} onPress={onLogout}>
          <Text style={styles.adminTabText}>🚪 Keluar</Text>
        </TouchableOpacity>
      </View>
      {activeTab === 'orders' && <FlatList data={orders} renderItem={renderOrder} keyExtractor={item => item.id} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadOrders} />} contentContainerStyle={styles.adminList} />}
      {activeTab === 'products' && <FlatList data={products} renderItem={renderProduct} keyExtractor={item => item.id.toString()} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadProducts} />} contentContainerStyle={styles.adminList} />}
      {activeTab === 'addProduct' && (
        <ScrollView style={styles.addProductForm}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>➕ Tambah Produk Baru</Text>
            <Text style={styles.label}>Nama Produk</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Nama produk" 
              value={newProduct.nama} 
              onChangeText={(t) => setNewProduct({...newProduct, nama: t})} 
            />
            <Text style={styles.label}>Satuan</Text>
            <TextInput 
              style={styles.input} 
              placeholder="kg, ekor, butir" 
              value={newProduct.satuan} 
              onChangeText={(t) => setNewProduct({...newProduct, satuan: t})} 
            />
            <Text style={styles.label}>Harga</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Harga" 
              value={newProduct.harga} 
              onChangeText={(t) => setNewProduct({...newProduct, harga: t})} 
              keyboardType="numeric" 
            />
            <Text style={styles.label}>Stok</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Stok" 
              value={newProduct.stok} 
              onChangeText={(t) => setNewProduct({...newProduct, stok: t})} 
              keyboardType="numeric" 
            />
            <Text style={styles.label}>Kategori</Text>
            <View style={styles.categoryButtons}>
              <TouchableOpacity 
                style={[styles.categoryBtn, newProduct.kategori === 'telur_doc' && styles.categoryBtnActive]} 
                onPress={() => setNewProduct({...newProduct, kategori: 'telur_doc'})}>
                <Text style={[styles.categoryBtnText, newProduct.kategori === 'telur_doc' && styles.categoryBtnTextActive]}>🥚 Telur & DOC</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.categoryBtn, newProduct.kategori === 'ayam' && styles.categoryBtnActive]} 
                onPress={() => setNewProduct({...newProduct, kategori: 'ayam'})}>
                <Text style={[styles.categoryBtnText, newProduct.kategori === 'ayam' && styles.categoryBtnTextActive]}>🍗 Ayam</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.categoryBtn, newProduct.kategori === 'sayur' && styles.categoryBtnActive]} 
                onPress={() => setNewProduct({...newProduct, kategori: 'sayur'})}>
                <Text style={[styles.categoryBtnText, newProduct.kategori === 'sayur' && styles.categoryBtnTextActive]}>🌿 Sayuran</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Gambar URL</Text>
            <TextInput 
              style={styles.input} 
              placeholder="https://..." 
              value={newProduct.gambar} 
              onChangeText={(t) => setNewProduct({...newProduct, gambar: t})} 
            />
            <Text style={styles.label}>Deskripsi</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              placeholder="Deskripsi produk" 
              value={newProduct.deskripsi} 
              onChangeText={(t) => setNewProduct({...newProduct, deskripsi: t})} 
              multiline 
              numberOfLines={3} 
            />
            <TouchableOpacity style={styles.btnPrimary} onPress={addProduct}>
              <Text style={styles.btnText}>💾 Simpan Produk</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { marginTop: 10, fontSize: 14, color: '#2e7d32' },
  scrollContent: { flexGrow: 1, paddingBottom: 30 },
  logoContainer: { alignItems: 'center', marginTop: 40, marginBottom: 25 },
  logoEmoji: { fontSize: 70 },
  logoTitle: { fontSize: 22, fontWeight: 'bold', color: '#2e7d32', marginTop: 8 },
  logoSubtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  formCard: { backgroundColor: 'white', borderRadius: 28, padding: 20, marginHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  tabBar: { flexDirection: 'row', marginBottom: 20, borderRadius: 28, backgroundColor: '#f1f3f4', padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 24, alignItems: 'center' },
  activeTab: { backgroundColor: '#2e7d32' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  activeTabText: { color: 'white' },
  label: { fontSize: 12, fontWeight: '500', color: '#5f6368', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#dadce0', borderRadius: 14, padding: 12, fontSize: 14, marginBottom: 16, backgroundColor: 'white' },
  otpInput: { fontSize: 24, letterSpacing: 6, textAlign: 'center' },
  passwordContainer: { position: 'relative', marginBottom: 16 },
  passwordInput: { marginBottom: 0, paddingRight: 45 },
  eyeIcon: { position: 'absolute', right: 14, top: 12, zIndex: 1 },
  eyeIconText: { fontSize: 18 },
  textArea: { height: 70, textAlignVertical: 'top' },
  btnPrimary: { backgroundColor: '#2e7d32', padding: 14, borderRadius: 28, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  btnText: { color: 'white', fontSize: 15, fontWeight: '600' },
  linkText: { color: '#2e7d32', textAlign: 'center', marginTop: 14, fontSize: 13 },
  header: { 
    backgroundColor: '#2e7d32', 
    paddingTop: 48, 
    paddingBottom: 16, 
    paddingHorizontal: 16, 
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24 
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  searchBar: { padding: 12, backgroundColor: 'white' },
  searchInput: { borderWidth: 1, borderColor: '#e8eaed', borderRadius: 25, padding: 12, fontSize: 13, backgroundColor: 'white' },
  filterChips: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e8eaed' },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 25, backgroundColor: '#f1f3f4', marginRight: 8 },
  chipActive: { backgroundColor: '#2e7d32' },
  chipText: { fontSize: 12, fontWeight: '500', color: '#666' },
  chipTextActive: { color: 'white' },
  productRow: { justifyContent: 'space-between', paddingHorizontal: 8 },
  productCard: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    marginBottom: 8, 
    width: (width - 36) / 2,
    overflow: 'hidden', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 2, 
    elevation: 1 
  },
  productImage: { width: '100%', height: 90, backgroundColor: '#f0f0f0' },
  productInfo: { padding: 6 },
  productName: { fontSize: 11, fontWeight: '600', marginBottom: 2, lineHeight: 14 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 2 },
  productPrice: { fontSize: 11, fontWeight: 'bold', color: '#2e7d32' },
  productUnit: { fontSize: 8, color: '#666', marginLeft: 2 },
  discountBadge: { fontSize: 7, color: '#e67e22', marginLeft: 3 },
  stockInfo: { fontSize: 8, color: '#666', marginVertical: 2 },
  qtyControl: { flexDirection: 'column', alignItems: 'stretch', marginTop: 2, gap: 3 },
  qtyButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f3f4', borderRadius: 14, padding: 1 },
  qtyBtn: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyBtnText: { fontSize: 11, fontWeight: 'bold', color: '#2e7d32' },
  qtyValue: { minWidth: 22, textAlign: 'center', fontWeight: '600', fontSize: 10 },
  addToCartBtn: { backgroundColor: '#2e7d32', paddingVertical: 4, paddingHorizontal: 6, borderRadius: 14, alignItems: 'center', width: '100%' },
  addToCartDisabled: { backgroundColor: '#ccc' },
  addToCartText: { color: 'white', fontSize: 8, fontWeight: '600' },
  bottomNav: { flexDirection: 'row', backgroundColor: 'white', paddingVertical: 8, paddingBottom: 12, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  navItemActive: { color: '#2e7d32' },
  navIcon: { fontSize: 22 },
  navText: { fontSize: 10, color: '#9aa0a6', marginTop: 2 },
  navTextActive: { color: '#2e7d32' },
  cartBadge: { position: 'absolute', top: -6, right: -10, backgroundColor: '#ea4335', borderRadius: 9, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  cartBadgeText: { color: 'white', fontSize: 9, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e8eaed' },
  modalTitle: { fontSize: 16, fontWeight: '600' },
  modalClose: { fontSize: 24, color: '#666' },
  radioGroup: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  radioOption: { flex: 1, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#dadce0', alignItems: 'center' },
  radioSelected: { backgroundColor: '#e8f0e8', borderColor: '#2e7d32' },
  radioText: { fontSize: 13 },
  locationBtn: { backgroundColor: '#2e7d32', padding: 10, borderRadius: 14, alignItems: 'center', marginBottom: 16 },
  locationBtnText: { color: 'white', fontSize: 13, fontWeight: '500' },
  pickerButton: { borderWidth: 1, borderColor: '#dadce0', borderRadius: 14, padding: 12, marginBottom: 16, backgroundColor: 'white' },
  pickerButtonText: { fontSize: 14 },
  pickerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  pickerModalContent: { backgroundColor: 'white', borderRadius: 18, padding: 16, width: width - 40 },
  pickerModalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 14, textAlign: 'center' },
  pickerOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#e8eaed', alignItems: 'center' },
  pickerOptionText: { fontSize: 14 },
  pickerCancelBtn: { padding: 12, alignItems: 'center', marginTop: 8 },
  pickerCancelText: { fontSize: 14, color: '#dc3545' },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  serviceOption: { backgroundColor: '#f1f3f4', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  serviceSelected: { backgroundColor: '#2e7d32' },
  serviceText: { fontSize: 12 },
  serviceSelectedText: { color: 'white', fontWeight: '600' },
  totalContainer: { backgroundColor: '#f1f3f4', borderRadius: 14, padding: 14, marginBottom: 16 },
  totalText: { fontSize: 15, fontWeight: 'bold', color: '#2e7d32' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  orderCard: { backgroundColor: 'white', borderRadius: 16, padding: 14, marginHorizontal: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  orderId: { fontWeight: 'bold', fontSize: 13, marginBottom: 6, color: '#2e7d32' },
  orderProduct: { fontSize: 11, color: '#666', marginBottom: 6 },
  orderTotal: { fontSize: 13, fontWeight: 'bold', color: '#2e7d32', marginBottom: 6 },
  orderActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 16, alignSelf: 'flex-start', marginBottom: 6 },
  statusPending: { backgroundColor: '#fff3e0' },
  statusProses: { backgroundColor: '#e3f2fd' },
  statusSelesai: { backgroundColor: '#e8f5e9' },
  statusText: { fontSize: 10, fontWeight: '600', color: '#e67e22' },
  deleteBtn: { backgroundColor: '#dc3545', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, alignSelf: 'flex-start' },
  deleteBtnText: { color: 'white', fontSize: 11, fontWeight: '600' },
  adminTabs: { flexDirection: 'row', backgroundColor: 'white', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#e8eaed' },
  adminTab: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  adminTabActive: { borderBottomWidth: 2, borderBottomColor: '#2e7d32' },
  adminTabText: { fontSize: 12, fontWeight: '500', color: '#666' },
  adminTabTextActive: { color: '#2e7d32' },
  adminList: { padding: 12 },
  adminOrderCard: { backgroundColor: 'white', borderRadius: 14, padding: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  adminOrderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  adminOrderId: { fontWeight: 'bold', fontSize: 11 },
  adminOrderUser: { fontSize: 13, fontWeight: '500', marginBottom: 3 },
  adminOrderPhone: { fontSize: 11, color: '#666', marginBottom: 6 },
  adminOrderTotal: { fontSize: 13, fontWeight: 'bold', color: '#2e7d32', marginBottom: 6 },
  adminOrderAddress: { fontSize: 10, color: '#666', marginBottom: 10 },
  adminOrderActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusPickerBtn: { backgroundColor: '#2e7d32', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, flex: 1, alignItems: 'center' },
  statusPickerBtnText: { color: 'white', fontSize: 11, fontWeight: '500' },
  adminProductCard: { backgroundColor: 'white', borderRadius: 14, padding: 12, marginBottom: 10 },
  adminProductName: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  adminProductFields: { flexDirection: 'row', gap: 8 },
  adminField: { flex: 1 },
  adminFieldLabel: { fontSize: 10, color: '#666', marginBottom: 3 },
  adminFieldInput: { borderWidth: 1, borderColor: '#dadce0', borderRadius: 8, padding: 6, fontSize: 11 },
  addProductForm: { flex: 1, padding: 12 },
  formTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  categoryButtons: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  categoryBtn: { flex: 1, padding: 10, borderRadius: 14, backgroundColor: '#f1f3f4', alignItems: 'center' },
  categoryBtnActive: { backgroundColor: '#2e7d32' },
  categoryBtnText: { fontSize: 12, color: '#666' },
  categoryBtnTextActive: { color: 'white' },
  // ZOOM MODAL STYLES
  zoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  zoomContent: {
    backgroundColor: 'white',
    borderRadius: 28,
    width: width - 32,
    maxHeight: '90%',
    padding: 20,
    alignItems: 'center',
  },
  zoomCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#dc3545',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  zoomCloseText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  zoomImage: {
    width: width - 100,
    height: 200,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginTop: 20,
    marginBottom: 16,
  },
  zoomName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center',
    marginBottom: 8,
  },
  zoomDeskripsi: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  zoomPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  zoomPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  zoomUnit: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  zoomOriginalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 10,
  },
  zoomDiscount: {
    fontSize: 14,
    color: '#e67e22',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  zoomStock: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
    marginBottom: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#e8f5e9',
    borderRadius: 20,
  },
  zoomStockHabis: {
    color: '#dc3545',
    backgroundColor: '#ffebee',
  },
  zoomQtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  zoomQtyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  zoomQtyButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#f1f3f4',
    borderRadius: 40,
    padding: 6,
  },
  zoomQtyBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  zoomQtyBtnDisabled: {
    opacity: 0.4,
  },
  zoomQtyBtnText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  zoomQtyValue: {
    minWidth: 50,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  zoomAddToCartBtn: {
    backgroundColor: '#2e7d32',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 40,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  zoomAddToCartDisabled: {
    backgroundColor: '#ccc',
  },
  zoomAddToCartText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  zoomCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  zoomCancelText: {
    color: '#666',
    fontSize: 16,
  },
});

