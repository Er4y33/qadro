/**
 * Rehberli demo turunun adımları (hocaya canlı gösterim için).
 * Her adım bir ekrana bağlıdır ve o ekrandaki oyunlaştırma öğesini, denenecek eylemi ve dayandığı kuramı anlatır.
 * Ayrıntılı gerekçeler: docs/oyunlastirma-rotasi.md
 */
export interface DemoStep {
  id: string;
  path: string;
  title: string;
  /** Kullanıcının bu ekranda deneyeceği eylem */
  todo: string;
  /** Ekranda çalışan oyun mekaniği */
  mechanic: string;
  /** Mekaniğin dayandığı kuramlar */
  theory: { name: string; text: string }[];
}

export const DEMO_STEPS: DemoStep[] = [
  {
    id: "akis",
    path: "/",
    title: "Sorun ve hedef: maça gelmeyen oyuncu",
    todo: "Maç kartlarına bak: doluluk çubuğu ve 24 saatten az kalan eksik maçlardaki “Acil” etiketi.",
    mechanic: "Oyunlaştırma eğlence için değil, bir sorunu çözmek için: maçların dolması ve oyuncuların gerçekten gelmesi.",
    theory: [
      { name: "Deterding vd. (2011)", text: "Oyun öğeleri, oyun dışı bir bağlamda (maç organizasyonu) kullanılıyor. Qadro bir oyun değil." },
      { name: "D6 · Define", text: "İş hedefleri ölçülebilir: doluluk oranı, gelmeme oranı, S.O.S yanıt süresi." },
    ],
  },
  {
    id: "dizilim",
    path: "/mac/cuma-aksami-hali-saha/dizilim",
    title: "Saha dizilimi: yerini kendin seç",
    todo: "Sahadaki boş mevkilere dokun. Katılmak zorunda değilsin, seçimin nasıl çalıştığına bakman yeterli.",
    mechanic: "Maça katılırken sahada mevki seçilir; eksik mevkiler görünür olduğu için oyuncular ihtiyaca göre katılır.",
    theory: [
      { name: "Öz Belirleme Kuramı · Özerklik", text: "Oyuncu maçını, mevkisini ve sahasını kendisi seçer. Hiçbir görev zorunlu değildir." },
      { name: "MDA", text: "Mekanik: dizilim → Dinamik: eksik mevkiye göre oyuncu arama → Estetik: strateji ve sahiplenme." },
    ],
  },
  {
    id: "olustur",
    path: "/mac/olustur",
    title: "Maç oluştur: minimum seviye",
    todo: "3 adımlı sihirbazda branş ve formatı seç, son adımdaki minimum seviye ayarına bak.",
    mechanic: "Organizatör maçın minimum seviyesini belirler; benzer seviyedeki oyuncular aynı maçta buluşur.",
    theory: [
      { name: "Akış (Csikszentmihalyi)", text: "Zorluk ile beceri dengede olunca akış oluşur: maç ne çok kolay ne imkânsız." },
      { name: "Hexad · Socialiser", text: "5 maç organize eden “Organizatör” başarımını kazanır." },
    ],
  },
  {
    id: "sos",
    path: "/bildirimler",
    title: "S.O.S: son dakika eksiğini kapat",
    todo: "“Acil Kaleci Aranıyor!” kartında Kabul Et'e bas. Kadroya eklenirsin, +40 XP alır ve Kurtarıcı başarımına ilerlersin.",
    mechanic:
      "Kadroda eksik kalan oyuncu S.O.S başlatır; çağrı kadroda olmayan oyunculara düşer, ilk kabul eden kadroya girer. Yanıt süresi panelde ölçülür.",
    theory: [
      { name: "Malone ve Lepper · İş birliği", text: "Kişilerarası motivasyon: başkasına yardım etmek ödüllendirici bir deneyimdir." },
      { name: "Hexad · Philanthropist", text: "Yardımsever oyuncu tipi “Kurtarıcı” rozetiyle tanınır." },
      { name: "Hook modeli · Tetikleyici", text: "Bildirim yalnızca eyleme dönüşebilen bir olay için gönderilir." },
    ],
  },
  {
    id: "istekler",
    path: "/mac/atahan-pazar-maci/istekler",
    title: "İstekleri Yönet: güvenilirlik işe yarıyor",
    todo: "Organizatörü olduğun onaylı katılımlı maça 3 istek geldi. Güvenilirliklerine ve gelmediği maç sayısına bakıp onayla ya da reddet.",
    mechanic:
      "Organizatör “Katılımı ben onaylayayım” seçerse Maça Katıl istek gönderir. Takım arkadaşlarının oylarıyla oluşan güvenilirlik, burada gerçek bir karara dönüşür.",
    theory: [
      { name: "D6 · Hedef davranış", text: "Gelmeyen oyuncu sorununu azaltır: düşük güvenilirlik, onaylı maçlara girmeyi zorlaştırır." },
      { name: "Hexad · Disruptor", text: "Kuralları bozan oyuncunun etkisi oy kurallarıyla ve organizatör onayıyla sınırlanır." },
    ],
  },
  {
    id: "degerlendir",
    path: "/mac/demo-son-mac/degerlendir",
    title: "Maç sonu: takımı değerlendir, MVP seç",
    todo: "Her oyuncu için Geldi/Gelmedi seç ve istersen övgü ver. Son adımda maçın oyuncusunu seç: Oğuz'u seçersen MVP olur.",
    mechanic:
      "“Gelmedi” kararı tek oyla verilmez: en az 3 oy ve çoğunluk gerekir. MVP için en az 2 oy ve tek başına önde olmak gerekir. Maç XP'si, katılım oylarla onaylanınca verilir (sahte maç engeli).",
    theory: [
      { name: "Öz Belirleme Kuramı · İlişkisellik", text: "Takım arkadaşlarından gelen geri bildirim, aidiyeti güçlendirir." },
      { name: "Malone ve Lepper · Tanınma", text: "Övgüler sosyal tanınmadır; XP vermez, itibarı gösterir." },
      { name: "Hexad · Player", text: "MVP seçimi ödül odaklı oyuncuya hitap eder (Maçın Yıldızı başarımı)." },
    ],
  },
  {
    id: "profil",
    path: "/profil",
    title: "Profil: ilerleme, seri ve sezon",
    todo: "Seviye çubuğuna, haftalık seriye, sezon XP'sine, onay bekleyen maçlara ve başarımlara bak. S.O.S sonrası Kurtarıcı ilerlemesini gör.",
    mechanic:
      "XP ve seviye (yetkinlik), haftalık seri (alışkanlık), sezon XP'si (her sezon sıfırlanır), rozetler (davranış çeşitliliği).",
    theory: [
      { name: "Öz Belirleme Kuramı · Yetkinlik", text: "Seviye eğrisi yükseldikçe yavaşlar: ilk başarılar erken gelir." },
      { name: "Hook modeli · Yatırım", text: "Seri ve oyuncu kartı, kullanıcının emeğiyle büyür ve geri dönmesini sağlar." },
      {
        name: "Aşırı gerekçelendirme önlemi",
        text: "Qadro Puanı harcanamaz, rozetler XP vermez; seri kaybı için korkutucu uyarı yoktur.",
      },
    ],
  },
  {
    id: "siralama",
    path: "/siralama",
    title: "Şehrin En İyileri ve sezon sıralaması",
    todo: "Şehir sıralamasında kendi satırına ve bir üst hedefe kalan farka, altta da canlı sezon tablosuna bak. Bir oyuncunun adına dokununca herkese açık profili açılır.",
    mechanic:
      "Küresel tablo yok: şehir sıralaması ve bir üst hedefe kalan fark. Değerler takım arkadaşlarının oylarından hesaplanır. Sezon tablosu her üç ayda sıfırlanır.",
    theory: [
      { name: "Akış · Ulaşılabilir hedef", text: "En altta kalan çoğunluk için de görünür, yakın bir hedef olur." },
      { name: "PBL eleştirisi", text: "Liderlik tablosu tek başına değil, gerçek davranışa (gelmek, yardım etmek) bağlı XP ile çalışır." },
    ],
  },
  {
    id: "panel",
    path: "/panel",
    title: "Ölçüm: oyunlaştırma işe yarıyor mu?",
    todo: "Üstteki Oyunlaştırma Ölçütleri'ne bak: gelmeme oranı, S.O.S yanıt süresi, değerlendirme katılımı. Az önceki S.O.S yanıtın burada ölçüldü.",
    mechanic: "Her eylem user_events tablosuna yazılır; D6'nın ilk adımındaki hedefler buradan izlenir.",
    theory: [
      { name: "D6 · Define ve Deploy", text: "Hedef davranışlar ölçülmeden oyunlaştırmanın başarısı bilinemez." },
      { name: "Riskler", text: "Rozet dağılımı ve seri sayıları, mekaniklerin çok kolay ya da imkânsız olup olmadığını gösterir." },
    ],
  },
];

export const DEMO_STORAGE_KEY = "qadro-demo";
