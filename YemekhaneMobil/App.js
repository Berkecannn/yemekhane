import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity, ScrollView, Switch, Modal } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, useFocusEffect, DefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import QRCode from 'react-native-qrcode-svg';
import { useFonts, DarkerGrotesque_700Bold } from '@expo-google-fonts/darker-grotesque';

// ---------------------------------------------------
// 0. SİSTEM VERİLERİ VE TEMA
// ---------------------------------------------------
const UNIVERSITELER = [
  "Kocaeli Üniversitesi",
  "Yalova Üniversitesi",
  "Zonguldak Bülent Ecevit Üniversitesi",
  "İstanbul Teknik Üniversitesi",
  "Ankara Üniversitesi",
  "Ege Üniversitesi"
];

const lightColors = {
  background: '#ffffff', text: '#000000', textMuted: 'gray', card: '#f8f9fa', cardBorder: '#dee2e6',
  inputBg: '#f9f9f9', inputBorder: '#ccc', primary: '#f05800', success: '#28a745', danger: '#dc3545',
  ticketBg: '#fff0e6', ticketBorder: '#ffccb3', ticketText: '#cc4a00'
};
const darkColors = {
  background: '#121212', text: '#ffffff', textMuted: '#aaaaaa', card: '#1e1e1e', cardBorder: '#333333',
  inputBg: '#2c2c2c', inputBorder: '#444444', primary: '#f05800', success: '#22c55e', danger: '#ef4444',
  ticketBg: '#4d1c00', ticketBorder: '#802f00', ticketText: '#ffc299' 
};

const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => { SecureStore.getItemAsync('appTheme').then(savedTheme => { if (savedTheme === 'dark') setIsDarkMode(true); }); }, []);
  const toggleTheme = async () => { const newMode = !isDarkMode; setIsDarkMode(newMode); await SecureStore.setItemAsync('appTheme', newMode ? 'dark' : 'light'); };
  const theme = isDarkMode ? darkColors : lightColors;
  return <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>{children}</ThemeContext.Provider>;
};

// ---------------------------------------------------
// ÖZEL AÇILIR MENÜ (DROPDOWN) BİLEŞENİ
// ---------------------------------------------------
function CustomDropdown({ selectedValue, onSelect, placeholder }) {
  const { theme } = useContext(ThemeContext);
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={{ marginBottom: 15 }}>
      <TouchableOpacity 
        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, marginBottom: 0 }]} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={{ fontSize: 18, color: selectedValue ? theme.text : theme.textMuted }}>
          {selectedValue ? selectedValue : placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: theme.background, borderTopLeftRadius: 15, borderTopRightRadius: 15, maxHeight: '60%', padding: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 15, textAlign: 'center' }}>Üniversite Seçin</Text>
            <ScrollView>
              {UNIVERSITELER.map((uni, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={{ padding: 15, borderBottomWidth: 1, borderColor: theme.cardBorder }} 
                  onPress={() => { onSelect(uni); setModalVisible(false); }}
                >
                  <Text style={{ fontSize: 18, color: theme.text }}>{uni}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button title="İptal" color={theme.textMuted} onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------
// 1. GİRİŞ VE KAYIT EKRANLARI
// ---------------------------------------------------
function LoginScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);
  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [universityName, setUniversityName] = useState(""); // YENİ: Girişte Okul Seçimi
  const [sifreGizli, setSifreGizli] = useState(true);

  const handleLogin = () => {
    // 1. Verileri göndermeden önce temizliyoruz (.trim)
    const cleanStudentNumber = studentNumber.trim();
    
    if (!universityName) return Alert.alert("Uyarı", "Lütfen üniversitenizi seçin.");
    if (!cleanStudentNumber || !password) return Alert.alert("Uyarı", "Numara ve şifre gereklidir.");

    fetch('http://10.0.2.2:5260/api/auth/login', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json; charset=utf-8' }, 
      body: JSON.stringify({ 
        studentNumber: cleanStudentNumber, 
        password: password, 
        universityName: universityName // YENİ
      }) 
    })
    .then(async res => { const data = await res.json(); if (!res.ok) throw new Error(data.mesaj); await SecureStore.setItemAsync('userToken', data.token); navigation.replace('MainTabs', { studentNumber: cleanStudentNumber }); })
    .catch(err => Alert.alert("Giriş Başarısız", err.message));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
      <Text style={{ fontFamily: 'DarkerGrotesque_700Bold', fontSize: 48, textAlign: 'center', marginBottom: 40, color: theme.text, letterSpacing: -1 }}>
        Yemekhane Takip<Text style={{ color: theme.primary }}>.</Text>
      </Text>
      
      <CustomDropdown selectedValue={universityName} onSelect={setUniversityName} placeholder="Üniversitenizi Seçin" />
      
      <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]} placeholder="Öğrenci Numarası" placeholderTextColor={theme.textMuted} value={studentNumber} onChangeText={setStudentNumber} keyboardType="numeric" />
      
      <View style={[styles.passwordContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
        <TextInput style={[styles.passwordInput, { color: theme.text }]} placeholder="Şifre" placeholderTextColor={theme.textMuted} value={password} onChangeText={setPassword} secureTextEntry={sifreGizli} />
        <TouchableOpacity onPress={() => setSifreGizli(!sifreGizli)} style={{ padding: 10 }}><Ionicons name={sifreGizli ? "eye-off" : "eye"} size={20} color={theme.textMuted} /></TouchableOpacity>
      </View>
      
      <Button title="Giriş Yap" onPress={handleLogin} color={theme.primary} />
      <View style={{ marginTop: 15 }}><Button title="Hesabın yok mu? Kayıt Ol" onPress={() => navigation.navigate('Register')} color="gray" /></View>
    </View>
  );
}

function RegisterScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [universityName, setUniversityName] = useState(""); // YENİ: Dropdown kullanacak

  const handleRegister = () => {
    // 1. Kullanıcı yanlışlıkla boşluk girdiyse sil
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanStudentNumber = studentNumber.trim();

    if (!cleanFirstName || !cleanLastName || !cleanStudentNumber || !password || !universityName) {
      return Alert.alert("Uyarı", "Lütfen tüm alanları doldurun.");
    }
    
    fetch('http://10.0.2.2:5260/api/auth/register', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json; charset=utf-8' }, 
      body: JSON.stringify({ 
        firstName: cleanFirstName, 
        lastName: cleanLastName, 
        studentNumber: cleanStudentNumber, 
        password: password, 
        universityName: universityName 
      }) 
    })
    .then(async res => { const data = await res.json(); if (!res.ok) throw new Error(data.mesaj); Alert.alert("Kayıt Başarılı", "Şimdi giriş yapabilirsiniz."); navigation.navigate('Login'); })
    .catch(err => Alert.alert("Hata", err.message));
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={{ fontFamily: 'DarkerGrotesque_700Bold', fontSize: 36, color: theme.text, textAlign: 'center', marginBottom: 30, marginTop: 20 }}>Yeni Öğrenci Kaydı</Text>
      
      <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]} placeholder="Ad" placeholderTextColor={theme.textMuted} value={firstName} onChangeText={setFirstName} />
      <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]} placeholder="Soyad" placeholderTextColor={theme.textMuted} value={lastName} onChangeText={setLastName} />
      
      {/* YENİ: Metin kutusu yerine Dropdown kullanıyoruz */}
      <CustomDropdown selectedValue={universityName} onSelect={setUniversityName} placeholder="Üniversitenizi Seçin" />
      
      <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]} placeholder="Öğrenci Numarası" placeholderTextColor={theme.textMuted} value={studentNumber} onChangeText={(text) => setStudentNumber(text.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
      <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]} placeholder="Şifre" placeholderTextColor={theme.textMuted} value={password} onChangeText={setPassword} secureTextEntry={true} />
      
      <Button title="Kayıt Ol" onPress={handleRegister} color={theme.primary} />
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

// ---------------------------------------------------
// 2. ANA SAYFA 
// ---------------------------------------------------
function HomeScreen({ route, navigation }) {
  const { theme } = useContext(ThemeContext);
  const { studentNumber } = route.params;
  const [gununMenusu, setGununMenusu] = useState(null);
  const [mesaj, setMesaj] = useState("Menü yükleniyor...");
  const [qrVerisi, setQrVerisi] = useState(null);
  const [aktifBiletler, setAktifBiletler] = useState([]);
  const [mevcutBakiye, setMevcutBakiye] = useState("...");
  const [menuFiyati, setMenuFiyati] = useState(50);
  const [kullaniciOkulu, setKullaniciOkulu] = useState("");

  const [aylikMenuModal, setAylikMenuModal] = useState(false);
  const [aylikListe, setAylikListe] = useState([]);
  const [seciliTarih, setSeciliTarih] = useState(new Date());

  const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  const verileriGetir = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    if (!token) return;

    let ogrenciOkulu = "";

    try {
      const res = await fetch(`http://10.0.2.2:5260/api/student/bilgilerim/${studentNumber}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data && data.bakiye !== undefined) setMevcutBakiye(data.bakiye);
        if (data && data.okul) {
          ogrenciOkulu = data.okul;
          setKullaniciOkulu(data.okul);
        }
      }
    } catch (err) { console.log("Bilgiler çekilemedi:", err); }

    if (ogrenciOkulu) {
      const bugun = new Date().toISOString().split('T')[0]; 
      
      fetch(`http://10.0.2.2:5260/api/menu/${bugun}?university=${encodeURIComponent(ogrenciOkulu)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) { setGununMenusu(data); setMesaj(""); } else { setGununMenusu(null); setMesaj("Bugün için menü sisteme girilmemiş."); } })
        .catch(() => setMesaj("Bugün için menü sisteme girilmemiş."));

      fetch(`http://10.0.2.2:5260/api/settings/yemek-fiyati?university=${encodeURIComponent(ogrenciOkulu)}`)
        .then(res => res.json())
        .then(data => { if(data && data.fiyat) setMenuFiyati(data.fiyat); })
        .catch(err => console.log(err));
    } else {
      setMesaj("Üniversite bilginiz eksik olduğu için menü yüklenemiyor.");
    }

    fetch(`http://10.0.2.2:5260/api/student/aktif-biletlerim/${studentNumber}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : [])
      .then(data => setAktifBiletler(Array.isArray(data) ? data : []))
      .catch(err => console.log(err));
  };

  useFocusEffect(useCallback(() => { verileriGetir(); }, []));

  useEffect(() => {
    let interval;
    if (qrVerisi) {
      interval = setInterval(async () => {
        try {
          const token = await SecureStore.getItemAsync('userToken');
          const res = await fetch(`http://10.0.2.2:5260/api/student/bilet-durumu/${qrVerisi}`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (res.ok) { const data = await res.json(); if (data.isUsed) { setQrVerisi(null); verileriGetir(); } }
        } catch (e) { console.log(e); }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [qrVerisi]);

  const yemekSatinAl = async () => {
    setQrVerisi(null);  
    const token = await SecureStore.getItemAsync('userToken');
    if (!token) return navigation.reset({ index: 0, routes: [{ name: 'Login' }] });

    fetch(`http://10.0.2.2:5260/api/student/yemek-ye/${studentNumber}`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Authorization': `Bearer ${token}` } 
    })
    .then(async (res) => { const data = await res.json(); if (!res.ok) throw new Error(data.mesaj); return data; })
    .then(data => { setQrVerisi(data.qrKod); verileriGetir(); }).catch(err => Alert.alert("İşlem Başarısız", err.message));
  };

  const aylikMenuyuCek = (tarih, okul) => {
    const yil = tarih.getFullYear();
    const ay = tarih.getMonth() + 1;
    const seciliOkul = okul || kullaniciOkulu; 
    if (!seciliOkul) return;

    fetch(`http://10.0.2.2:5260/api/menu/aylik/${yil}/${ay}?university=${encodeURIComponent(seciliOkul)}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setAylikListe(data))
      .catch(err => console.log("Aylık menü hatası:", err));
  };

  const ayDegistir = (fark) => {
    const yeniTarih = new Date(seciliTarih);
    yeniTarih.setMonth(yeniTarih.getMonth() + fark);
    setSeciliTarih(yeniTarih);
    aylikMenuyuCek(yeniTarih, kullaniciOkulu);
  };

  const isDolu = (veri) => { return veri && veri.trim() !== ""; };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background, padding: 0 }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        
        <Text style={{ fontFamily: 'DarkerGrotesque_700Bold', fontSize: 28, color: theme.text, marginBottom: 15 }}>
          YT<Text style={{ color: theme.primary }}>.</Text> Paneli
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, backgroundColor: theme.card, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: theme.cardBorder }}>
          <View>
            <Text style={{ fontSize: 14, color: theme.textMuted }}>Hoş geldin,</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>{studentNumber}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 12, color: theme.textMuted, marginBottom: 2 }}>Mevcut Bakiye</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.primary }}>{mevcutBakiye} TL</Text>
          </View>
        </View>
        
        {qrVerisi ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: theme.primary, marginBottom: 15 }}>Geçiş Onaylandı!</Text>
            <Text style={{ fontSize: 14, color: theme.textMuted, marginBottom: 20, textAlign: 'center' }}>Kodu turnikeye okutun. Okutulduğunda bu ekran otomatik kapanacaktır.</Text>
            <View style={{ padding: 20, backgroundColor: 'white', borderRadius: 10, elevation: 5, marginBottom: 30 }}>
              <QRCode value={qrVerisi} size={220} backgroundColor="white" color="black" />
            </View>
            <Button title="Şimdilik Kapat" onPress={() => setQrVerisi(null)} color={theme.textMuted} />
          </View>
        ) : (
          <View>
            {aktifBiletler.length > 0 && (
              <View style={{ marginBottom: 25, backgroundColor: theme.ticketBg, padding: 15, borderRadius: 8, borderWidth: 1, borderColor: theme.ticketBorder }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.ticketText, marginBottom: 10 }}>🎫 Aktif Biletlerim ({aktifBiletler.length})</Text>
                {aktifBiletler.map((bilet, index) => (
                  <TouchableOpacity key={index} style={{ backgroundColor: theme.primary, padding: 12, borderRadius: 5, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' }} onPress={() => setQrVerisi(bilet.ticketCode)}>
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Bileti Göster</Text>
                    <Text style={{ color: 'white', fontSize: 12 }}>{new Date(bilet.createdAt).toLocaleTimeString()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Günün Menüsü</Text>
              <TouchableOpacity onPress={() => { setAylikMenuModal(true); aylikMenuyuCek(seciliTarih, kullaniciOkulu); }}>
                <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 16 }}>Aylık Liste 📅</Text>
              </TouchableOpacity>
            </View>

            {mesaj ? ( <Text style={{ fontSize: 16, color: theme.danger, marginBottom: 20 }}>{mesaj}</Text> ) : (gununMenusu && 
              <View style={{ padding: 15, borderWidth: 1, borderColor: theme.cardBorder, backgroundColor: theme.card, borderRadius: 5, marginBottom: 20 }}>
                {isDolu(gununMenusu.soup) && <Text style={{ fontSize: 16, marginBottom: 5, color: theme.text }}>🥣 Çorba: {gununMenusu.soup}</Text>}
                {isDolu(gununMenusu.mainDish) && <Text style={{ fontSize: 16, marginBottom: 5, color: theme.text }}>🍲 Ana Yemek: {gununMenusu.mainDish}</Text>}
                {isDolu(gununMenusu.sideDish) && <Text style={{ fontSize: 16, marginBottom: 5, color: theme.text }}>🍚 Y. Yemek: {gununMenusu.sideDish}</Text>}
                {isDolu(gununMenusu.dessert) && <Text style={{ fontSize: 16, marginBottom: 5, color: theme.text }}>🍰 Tatlı: {gununMenusu.dessert}</Text>}
                {isDolu(gununMenusu.drink) && <Text style={{ fontSize: 16, marginBottom: 5, color: theme.text }}>🥤 İçecek: {gununMenusu.drink}</Text>}
                {gununMenusu.totalCalories > 0 && <Text style={{ fontSize: 16, marginTop: 10, fontWeight: 'bold', color: theme.text }}>🔥 Kalori: {gununMenusu.totalCalories} kcal</Text>}
              </View>
            )}
            <View style={{ padding: 15, backgroundColor: theme.card, borderRadius: 5, borderWidth: 1, borderColor: theme.cardBorder }}>
              <Button title={`Yemek Satın Al (${menuFiyati} TL)`} onPress={yemekSatinAl} color={theme.primary} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* AYLIK MENÜ MODALI */}
      <Modal visible={aylikMenuModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: theme.cardBorder }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>Aylık Yemek Listesi</Text>
            <TouchableOpacity onPress={() => setAylikMenuModal(false)}>
              <Ionicons name="close" size={30} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: theme.card }}>
            <TouchableOpacity onPress={() => ayDegistir(-1)}><Ionicons name="chevron-back" size={28} color={theme.primary} /></TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>{aylar[seciliTarih.getMonth()]} {seciliTarih.getFullYear()}</Text>
            <TouchableOpacity onPress={() => ayDegistir(1)}><Ionicons name="chevron-forward" size={28} color={theme.primary} /></TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 15, paddingBottom: 40 }}>
            {aylikListe.length === 0 ? (
              <Text style={{ textAlign: 'center', color: theme.textMuted, marginTop: 30, fontSize: 16 }}>Bu ay için henüz menü girilmemiş.</Text>
            ) : (
              aylikListe.map((menu, index) => {
                const gun = new Date(menu.date).getDate();
                const haftaninGunu = new Date(menu.date).toLocaleDateString('tr-TR', { weekday: 'long' });

                return (
                  <View key={index} style={{ marginBottom: 15, padding: 15, borderWidth: 1, borderColor: theme.cardBorder, backgroundColor: theme.card, borderRadius: 8 }}>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: theme.cardBorder, paddingBottom: 8, marginBottom: 8 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 16, color: theme.primary }}>{gun} {aylar[seciliTarih.getMonth()]} - {haftaninGunu}</Text>
                    </View>
                    {isDolu(menu.soup) && <Text style={{ color: theme.text, marginBottom: 3 }}>• {menu.soup}</Text>}
                    {isDolu(menu.mainDish) && <Text style={{ color: theme.text, marginBottom: 3 }}>• {menu.mainDish}</Text>}
                    {isDolu(menu.sideDish) && <Text style={{ color: theme.text, marginBottom: 3 }}>• {menu.sideDish}</Text>}
                    {isDolu(menu.dessert) && <Text style={{ color: theme.text, marginBottom: 3 }}>• {menu.dessert}</Text>}
                    {isDolu(menu.drink) && <Text style={{ color: theme.text, marginBottom: 3 }}>• {menu.drink}</Text>}
                  </View>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ---------------------------------------------------
// 3. CÜZDAN EKRANI
// ---------------------------------------------------
function WalletScreen({ route }) {
  const { theme, isDarkMode } = useContext(ThemeContext);
  const { studentNumber } = route.params;
  const [kartNo, setKartNo] = useState("");
  const [skt, setSkt] = useState("");
  const [cvv, setCvv] = useState("");
  const [kartiKaydet, setKartiKaydet] = useState(false);
  const [kartIsmi, setKartIsmi] = useState("");
  const [miktar, setMiktar] = useState("");
  const [kayitliKartlar, setKayitliKartlar] = useState([]);
  const [secilenKartId, setSecilenKartId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      async function kartlariGetir() {
        const token = await SecureStore.getItemAsync('userToken');
        if (!token) return;
        fetch(`http://10.0.2.2:5260/api/student/kartlarim/${studentNumber}`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.ok ? res.json() : []).then(data => setKayitliKartlar(Array.isArray(data) ? data : [])).catch(err => console.log(err));
      }
      kartlariGetir();
    }, [studentNumber])
  );

  const handleKartNoChange = (text) => setKartNo(text.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 '));
  const handleSktChange = (text) => { const r = text.replace(/\D/g, ''); setSkt(r.length > 2 ? r.substring(0, 2) + '/' + r.substring(2, 4) : r); };

  const bakiyeYukle = async (hazirTutar) => {
    const yuklenecekMiktar = hazirTutar || parseFloat(miktar);
    if (!yuklenecekMiktar || yuklenecekMiktar <= 0) return Alert.alert("Uyarı", "Geçerli bir tutar girin.");

    if (!secilenKartId) {
      if (kartNo.length < 19 || skt.length < 5 || cvv.length < 3) return Alert.alert("Uyarı", "Lütfen kart bilgilerinizi eksiksiz girin.");
      const [ay, yil] = skt.split('/'); const expMonth = parseInt(ay, 10); const expYear = parseInt("20" + yil, 10); const now = new Date();
      if (expMonth < 1 || expMonth > 12) return Alert.alert("Geçersiz Tarih", "Ay değeri 01 ile 12 arasında olmalıdır.");
      if (expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) return Alert.alert("Hata", "Kart Süresi Dolmuş.");
    }

    fetch(`http://10.0.2.2:5260/api/student/bakiye-yukle/${studentNumber}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify({ miktar: yuklenecekMiktar })
    }).then(async res => {
      const data = await res.json(); if (!res.ok) throw new Error(data.mesaj); Alert.alert("Ödeme Başarılı!", data.mesaj);
      if (kartiKaydet && !secilenKartId) {
        const token = await SecureStore.getItemAsync('userToken');
        fetch(`http://10.0.2.2:5260/api/student/kart-kaydet/${studentNumber}`, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ cardAlias: kartIsmi, fullCardNumber: kartNo }) });
      }
      setKartNo(""); setSkt(""); setCvv(""); setMiktar(""); setKartiKaydet(false); setKartIsmi(""); setSecilenKartId(null);
    }).catch(err => Alert.alert("Hata", err.message));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background, padding: 0 }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        <Text style={{ fontFamily: 'DarkerGrotesque_700Bold', fontSize: 32, color: theme.text, marginBottom: 20, textAlign: 'center', marginTop: 10 }}>Cüzdan</Text>
        
        {kayitliKartlar.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: theme.text }}>Kayıtlı Kartlarım</Text>
            {kayitliKartlar.map(kart => (
              <TouchableOpacity key={kart.id} onPress={() => { setSecilenKartId(secilenKartId === kart.id ? null : kart.id); setKartNo(""); setSkt(""); setCvv(""); setKartiKaydet(false); }} style={{ padding: 15, borderWidth: 2, borderColor: secilenKartId === kart.id ? theme.primary : theme.cardBorder, borderRadius: 8, marginBottom: 10, backgroundColor: secilenKartId === kart.id ? theme.ticketBg : theme.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontWeight: 'bold', color: secilenKartId === kart.id ? theme.primary : theme.text }}>💳 {kart.cardAlias}</Text>
                  <Text style={{ color: theme.textMuted, marginTop: 5 }}>{kart.maskedCardNumber}</Text>
                </View>
                {secilenKartId === kart.id && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
              </TouchableOpacity>
            ))}
            <Text style={{ textAlign: 'center', color: theme.textMuted, marginVertical: 10 }}>-- VEYA YENİ BİR KART GİRİN --</Text>
          </View>
        )}
        
        <View style={{ backgroundColor: isDarkMode ? '#1a1a1a' : '#1e293b', padding: 20, borderRadius: 10, marginBottom: 25, elevation: 5, opacity: secilenKartId ? 0.5 : 1 }}>
          <Text style={{ color: 'white', fontSize: 16, marginBottom: 15, fontWeight: 'bold' }}>Kredi/Banka Kartı Bilgileri</Text>
          <TextInput editable={!secilenKartId} style={{...styles.input, backgroundColor: '#f8f9fa', color: 'black', marginBottom: 10}} placeholder="Kart Numarası (16 Hane)" placeholderTextColor="gray" value={kartNo} onChangeText={handleKartNoChange} keyboardType="numeric" maxLength={19} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TextInput editable={!secilenKartId} style={{...styles.input, backgroundColor: '#f8f9fa', color: 'black', flex: 0.48, marginBottom: 0}} placeholder="AA/YY" placeholderTextColor="gray" value={skt} onChangeText={handleSktChange} keyboardType="numeric" maxLength={5} />
            <TextInput editable={!secilenKartId} style={{...styles.input, backgroundColor: '#f8f9fa', color: 'black', flex: 0.48, marginBottom: 0}} placeholder="CVV" placeholderTextColor="gray" value={cvv} onChangeText={setCvv} keyboardType="numeric" maxLength={3} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15 }}>
            <Switch disabled={secilenKartId !== null} value={kartiKaydet} onValueChange={setKartiKaydet} trackColor={{ false: "#767577", true: theme.primary }} thumbColor={"#f4f3f4"} />
            <Text style={{ color: 'white', marginLeft: 10 }}>Kartımı güvenle kaydet</Text>
          </View>
          {kartiKaydet && ( <TextInput style={{...styles.input, backgroundColor: '#f8f9fa', color: 'black', marginTop: 10, marginBottom: 0, padding: 8}} placeholder="Karta bir isim verin (Örn: Ziraat Kartım)" placeholderTextColor="gray" value={kartIsmi} onChangeText={setKartIsmi} /> )}
        </View>

        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: theme.text }}>Yüklenecek Tutar Seçimi</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <View style={{ flex: 1, marginRight: 5 }}><Button title="50 TL" onPress={() => bakiyeYukle(50)} color={theme.textMuted} /></View>
          <View style={{ flex: 1, marginHorizontal: 5 }}><Button title="100 TL" onPress={() => bakiyeYukle(100)} color={theme.primary} /></View>
          <View style={{ flex: 1, marginLeft: 5 }}><Button title="200 TL" onPress={() => bakiyeYukle(200)} color={theme.success} /></View>
        </View>
        <Text style={{ textAlign: 'center', marginBottom: 10, color: theme.textMuted }}>Veya farklı bir tutar girin:</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]} placeholder="Örn: 150" placeholderTextColor={theme.textMuted} value={miktar} onChangeText={setMiktar} keyboardType="numeric" />
        <Button title="Ödemeyi Tamamla" onPress={() => bakiyeYukle(null)} color={theme.primary} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------
// 4. PROFİL EKRANI
// ---------------------------------------------------
function ProfileScreen({ route, navigation }) {
  const { theme, isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { studentNumber } = route.params;
  const [yeniSifre, setYeniSifre] = useState("");
  const [sifreGizli, setSifreGizli] = useState(true);
  const [kayitliKartlar, setKayitliKartlar] = useState([]);
  const [kullaniciBilgisi, setKullaniciBilgisi] = useState({ ad: "", soyad: "", ogrenciNo: "", okul: "" });
  const [kartEkleAcik, setKartEkleAcik] = useState(false);
  const [yeniKartNo, setYeniKartNo] = useState("");
  const [yeniSkt, setYeniSkt] = useState("");
  const [yeniCvv, setYeniCvv] = useState("");
  const [yeniKartIsmi, setYeniKartIsmi] = useState("");

  const verileriGetir = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    if (!token) return;
    fetch(`http://10.0.2.2:5260/api/student/bilgilerim/${studentNumber}`, { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => res.json()).then(data => { if(data.ad) setKullaniciBilgisi(data); }).catch(err => console.log(err));

    fetch(`http://10.0.2.2:5260/api/student/kartlarim/${studentNumber}`, { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => res.ok ? res.json() : []).then(data => setKayitliKartlar(Array.isArray(data) ? data : [])).catch(err => console.log(err));
  };

  useFocusEffect(useCallback(() => { verileriGetir(); }, []));

  const kartSil = async (cardId) => {
    Alert.alert("Emin misiniz?", "Bu kartı silmek istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      { text: "Evet, Sil", onPress: async () => {
          const token = await SecureStore.getItemAsync('userToken');
          fetch(`http://10.0.2.2:5260/api/student/kart-sil/${cardId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
          .then(async res => { const data = await res.json(); if (!res.ok) throw new Error(data.mesaj); verileriGetir(); })
          .catch(err => Alert.alert("Hata", err.message));
        }
      }
    ]);
  };

  const profilKartEkle = async () => {
    if (yeniKartNo.length < 19 || yeniSkt.length < 5 || yeniCvv.length < 3 || !yeniKartIsmi) return Alert.alert("Uyarı", "Eksiksiz girin.");
    const [ay, yil] = yeniSkt.split('/'); const expMonth = parseInt(ay, 10); const expYear = parseInt("20" + yil, 10); const now = new Date();
    if (expMonth < 1 || expMonth > 12 || expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) return Alert.alert("Hata", "Geçersiz Tarih");

    const token = await SecureStore.getItemAsync('userToken');
    fetch(`http://10.0.2.2:5260/api/student/kart-kaydet/${studentNumber}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ cardAlias: yeniKartIsmi, fullCardNumber: yeniKartNo })
    }).then(async res => {
      const data = await res.json(); if (!res.ok) throw new Error(data.mesaj);
      setYeniKartNo(""); setYeniSkt(""); setYeniCvv(""); setYeniKartIsmi(""); setKartEkleAcik(false); verileriGetir(); 
    }).catch(err => Alert.alert("Hata", err.message));
  };

  const handleKartNoChange = (text) => setYeniKartNo(text.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 '));
  const handleSktChange = (text) => { const r = text.replace(/\D/g, ''); setYeniSkt(r.length > 2 ? r.substring(0, 2) + '/' + r.substring(2, 4) : r); };

  const sifreGuncelle = async () => {
    if (!yeniSifre) return;
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{6,}$/.test(yeniSifre)) return Alert.alert("Hata", "Şifre kurallara uymuyor.");
    const token = await SecureStore.getItemAsync('userToken');
    fetch(`http://10.0.2.2:5260/api/student/sifre-guncelle/${studentNumber}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ yeniSifre })
    }).then(async res => { const data = await res.json(); if (!res.ok) throw new Error(data.mesaj); Alert.alert("Başarılı", data.mesaj); setYeniSifre(""); })
    .catch(err => Alert.alert("Hata", err.message));
  };

  const handleLogout = async () => { await SecureStore.deleteItemAsync('userToken'); navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); };

  const hesapSil = () => {
    Alert.alert(
      "Hesabı Sil",
      "Hesabınızı tamamen silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm bakiyeniz, biletleriniz kaybolur.",
      [
        { text: "Hayır", style: "cancel" },
        { 
          text: "Evet, Sil", 
          style: "destructive", 
          onPress: async () => {
            const token = await SecureStore.getItemAsync('userToken');
            fetch(`http://10.0.2.2:5260/api/student/hesap-sil/${studentNumber}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
            .then(async res => {
              if (!res.ok) throw new Error("Hesap silinirken bir hata oluştu.");
              Alert.alert("Başarılı", "Hesabınız kalıcı olarak silindi.");
              await SecureStore.deleteItemAsync('userToken');
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            })
            .catch(err => Alert.alert("Hata", err.message));
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background, padding: 0 }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 50 }}>
        <Text style={{ fontFamily: 'DarkerGrotesque_700Bold', fontSize: 32, color: theme.text, marginBottom: 20, textAlign: 'center', marginTop: 10 }}>Profil & Ayarlar</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.card, padding: 15, borderRadius: 5, marginBottom: 20, borderWidth: 1, borderColor: theme.cardBorder }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={isDarkMode ? "moon" : "sunny"} size={24} color={isDarkMode ? theme.primary : "#ffc107"} style={{ marginRight: 10 }} />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>Karanlık Tema</Text>
          </View>
          <Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ false: "#767577", true: theme.primary }} thumbColor={"#f4f3f4"} />
        </View>

        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: theme.text }}>Bilgilerim</Text>
        <View style={{ backgroundColor: theme.card, padding: 15, borderRadius: 5, marginBottom: 20, borderWidth: 1, borderColor: theme.cardBorder }}>
          <Text style={{ fontSize: 14, color: theme.textMuted }}>Ad Soyad</Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: theme.text }}>{kullaniciBilgisi.ad ? `${kullaniciBilgisi.ad} ${kullaniciBilgisi.soyad}` : "Yükleniyor..."}</Text>
          <Text style={{ fontSize: 14, color: theme.textMuted }}>Öğrenci Numarası</Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: theme.text }}>{studentNumber}</Text>
          <Text style={{ fontSize: 14, color: theme.textMuted }}>Üniversite</Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>{kullaniciBilgisi.okul || "Belirtilmemiş"}</Text>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Kayıtlı Kartlarım</Text>
          <TouchableOpacity onPress={() => setKartEkleAcik(!kartEkleAcik)}><Ionicons name={kartEkleAcik ? "close-circle" : "add-circle"} size={28} color={kartEkleAcik ? theme.danger : theme.success} /></TouchableOpacity>
        </View>
        {kartEkleAcik && (
          <View style={{ backgroundColor: theme.card, padding: 15, borderRadius: 5, marginBottom: 15, borderWidth: 1, borderColor: theme.cardBorder }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 10, color: theme.text }}>Yeni Kart Ekle</Text>
            <TextInput style={{...styles.input, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text, padding: 8}} placeholder="Karta İsim Ver (Örn: Ziraat)" placeholderTextColor={theme.textMuted} value={yeniKartIsmi} onChangeText={setYeniKartIsmi} />
            <TextInput style={{...styles.input, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text, padding: 8}} placeholder="Kart Numarası" placeholderTextColor={theme.textMuted} value={yeniKartNo} onChangeText={handleKartNoChange} keyboardType="numeric" maxLength={19} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><TextInput style={{...styles.input, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text, flex: 0.48, padding: 8}} placeholder="AA/YY" placeholderTextColor={theme.textMuted} value={yeniSkt} onChangeText={handleSktChange} keyboardType="numeric" maxLength={5} /><TextInput style={{...styles.input, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text, flex: 0.48, padding: 8}} placeholder="CVV" placeholderTextColor={theme.textMuted} value={yeniCvv} onChangeText={setYeniCvv} keyboardType="numeric" maxLength={3} /></View>
            <Button title="Kartı Güvenle Kaydet" onPress={profilKartEkle} color={theme.primary} />
          </View>
        )}
        {kayitliKartlar.length === 0 ? <Text style={{ color: theme.textMuted, marginBottom: 20 }}>Henüz kayıtlı kartınız bulunmuyor.</Text> : kayitliKartlar.map(kart => (
          <View key={kart.id} style={{ padding: 15, borderWidth: 1, borderColor: theme.cardBorder, backgroundColor: theme.card, borderRadius: 5, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View><Text style={{ fontWeight: 'bold', color: theme.text }}>💳 {kart.cardAlias}</Text><Text style={{ color: theme.textMuted, marginTop: 5 }}>{kart.maskedCardNumber}</Text></View>
            <TouchableOpacity onPress={() => kartSil(kart.id)} style={{ padding: 10 }}><Ionicons name="trash" size={24} color={theme.danger} /></TouchableOpacity>
          </View>
        ))}
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 10, marginBottom: 10, color: theme.text }}>Güvenlik / Şifre Değiştir</Text>
        <View style={[styles.passwordContainer, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
          <TextInput style={[styles.passwordInput, { color: theme.text }]} placeholder="Yeni Güçlü Şifre Belirle" placeholderTextColor={theme.textMuted} value={yeniSifre} onChangeText={setYeniSifre} secureTextEntry={sifreGizli} />
          <TouchableOpacity onPress={() => setSifreGizli(!sifreGizli)} style={{ padding: 10 }}><Ionicons name={sifreGizli ? "eye-off" : "eye"} size={20} color={theme.textMuted} /></TouchableOpacity>
        </View>
        <Button title="Şifremi Güncelle" onPress={sifreGuncelle} color={theme.primary} />
        
        <View style={{ marginTop: 40 }}>
          <Button title="Sistemden Çıkış Yap" onPress={handleLogout} color={theme.textMuted} />
        </View>

        <View style={{ marginTop: 15 }}>
          <Button title="Hesabımı Kalıcı Olarak Sil" onPress={hesapSil} color={theme.danger} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------
// 5. ALT MENÜ YAPISI VE ROUTER
// ---------------------------------------------------
const Tab = createBottomTabNavigator();

function MainTabs({ route }) {
  const { theme } = useContext(ThemeContext);
  const { studentNumber } = route.params;
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Ana Sayfa') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Cüzdan') iconName = focused ? 'wallet' : 'wallet-outline';
          else if (route.name === 'Profil') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.cardBorder }
      })}>
      <Tab.Screen name="Ana Sayfa" component={HomeScreen} initialParams={{ studentNumber }} />
      <Tab.Screen name="Cüzdan" component={WalletScreen} initialParams={{ studentNumber }} />
      <Tab.Screen name="Profil" component={ProfileScreen} initialParams={{ studentNumber }} />
    </Tab.Navigator>
  );
}

const Stack = createNativeStackNavigator();

function MainApp() {
  const { isDarkMode } = useContext(ThemeContext);
  const navTheme = isDarkMode ? NavigationDarkTheme : DefaultTheme;
  
  let [fontsLoaded] = useFonts({ DarkerGrotesque_700Bold });
  if (!fontsLoaded) return null; 

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Kayıt Ol', headerStyle: { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }, headerTintColor: isDarkMode ? '#fff' : '#000' }} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: { borderWidth: 1, padding: 12, marginBottom: 15, borderRadius: 5, fontSize: 18 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 5, marginBottom: 15 },
  passwordInput: { flex: 1, padding: 12, fontSize: 18 }
});