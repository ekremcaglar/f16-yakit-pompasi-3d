// Kaynaklar ve bileşen bilgileri. Değerler yalnızca aşağıdaki açık kaynaklardan alınmıştır;
// kaynakta olmayan her sayı "yaklaşık / eğitim amaçlı" olarak işaretlenir.
export const SOURCES = [
  { id:'eaton-f16', n:1, kind:'Üretici broşürü',
    title:'Eaton Aerospace — "Lockheed Martin F-16" ürün broşürü (C5-47C, Ağustos 2023)',
    url:'https://www.eaton.com/content/dam/eaton/markets/aerospace/eaton-c5-47c-f16-brochure.pdf',
    why:'F-16 yakıt boost pompası: santrifüj, çift girişli (pozitif/negatif G), 200 VAC 400 Hz, 73 gpm @ 11 veya 17 psid. Transfer pompası: 37 gpm @ 14 psid, kendinden emişli, buhar tahliyeli. FFP: tek hidrolik motorla tahrikli pozitif deplasmanlı kanatlı (vane) pompalar. F110 ana yakıt pompası: santrifüj boost + dişli (gear) kademe.' },
  { id:'derco-ffp', n:2, kind:'Distribütör bilgi föyü',
    title:'Derco Aerospace / Eaton — "F-16 Fuel Flow Proportioner Assembly" (Lockheed Martin sitesi)',
    url:'https://www.lockheedmartin.com/content/dam/lockheed-martin/rms/documents/derco-aerospace/Eaton%20Aerospace.pdf',
    why:'FFP: iki paralel vane pompası, her birinin ayrı girişi, ortak çıkış; ileri/arka tanklar eşit hızda boşalır (ağırlık merkezi). Pompa arızasında geri akışı önleyen swing check valfler. FFP P/N 60957, LM P/N 16VP006-3.' },
  { id:'bms-dash1', n:3, kind:'Simülasyon topluluğu el kitabı',
    title:'Falcon BMS — TO 1F-16CM/AM-1 BMS (4.38, 2025) Bölüm 3: Fuel System',
    url:'https://cdn.falcon-bms.com/docs/4.38/TO%201F-16CMAM-1%20BMS.pdf',
    why:'Resmî değil; gerçek uçuş el kitabı yapısını izleyen topluluk dokümanı. 7 iç tank, 2 rezervuar tankı motoru besler; ileri/arka sistemler; sifon + güçlü transfer; rezervuarlardaki elektrikli boost pompaları → FFP (hidrolik A sistemi) → motor; ENG FEED NORM/OFF.' },
  { id:'eaton-9602', n:4, kind:'Üretici veri sayfası (F-16 değil)',
    title:'Eaton — Fuel Boost Pump Type 9602 / Canister 9603 veri sayfası (Boeing 777)',
    url:'https://www.eaton.com/content/dam/eaton/products/pumps/aerospace-fuel-pumps/documents/eaton-type9602-fuel-boost-pump-b777-datasheet-ds600-5b-en-us.pdf',
    why:'Tank içi boost pompası mimarisi için genel referans: yakıta batık (fuel-flooded) 3 fazlı asenkron motor, yakıtla yağlanan/soğutulan rulmanlar, kuru çalışma kabiliyeti, aşırı ısınmada beslemeyi kesen termal koruyucu, patlama-geçirmez yapı.' },
  { id:'eaton-vf', n:5, kind:'Üretici veri sayfası (F-16 değil)',
    title:'Eaton — Variable Frequency Fuel Pumps veri sayfası (DS600-35A, 2013)',
    url:'https://www.eaton.com/content/dam/eaton/products/pumps/aerospace-fuel-pumps/documents/eaton-variable-frequency-fuel-pump-datasheet-ds600-35a-en-us.pdf',
    why:'Elektrik bileşenlerinin patlama-geçirmez hücrelerde olması; giriş/çıkış valfli kanister montajı (tank boşaltmadan sökme); sıcak yakıt ve yüksek irtifada performans.' },
  { id:'nasa-1970', n:6, kind:'NASA teknik rapor',
    title:'NASA NTRS 19700008052 — "High Speed – High Flow" yakıt pompası çalışması (1970)',
    url:'https://ntrs.nasa.gov/api/citations/19700008052/downloads/19700008052.pdf',
    why:'Tank boost pompalarının tipik basınç artışı ~18 psi; düşük yakıt seviyesi ve yüksek irtifada kaynayan yakıt nedeniyle kavitasyon; NPSH sağlamak için indüktör/boost kademeleri.' },
  { id:'cranfield-cav', n:7, kind:'Akademik rapor',
    title:'Aeronautical Research Council CP-1128 — "Temperature and Fluid Property Effects on Cavitation in Aircraft Fuel Pumps" (Cranfield arşivi)',
    url:'https://reports.aerade.cranfield.ac.uk/bitstream/handle/1826.2/1141/arc-cp-1128.pdf?isAllowed=y&sequence=1',
    why:'NPSH tanımı; kerosende çözünmüş havanın gaz kavitasyonuna yol açması; sıcaklığın kavitasyon performansına etkisi.' },
  { id:'asme-sizing', n:8, kind:'Hakemli makale',
    title:'ASME J. Fluids Eng. — "Sizing of an Aircraft Fuel Pump" (doi:10.1115/1.2817144)',
    url:'https://doi.org/10.1115/1.2817144',
    why:'Yüksek irtifada çözünmüş gaz nedeniyle iki fazlı girişe göre indüktör, çark ve salyangoz (volute) boyutlandırması; tipik bir savaş uçağı boost pompasına uygulanmış.' },
  { id:'f16net', n:9, kind:'Forum — gayriresmî',
    title:'F-16.net forumu — "F-16 Block 30 Fuel System" başlığı (bakım personeli yorumları)',
    url:'https://www.f-16.net/forum/viewtopic.php?f=2&t=2871',
    why:'Doğrulanmamış saha bilgisi: iç tank basıncı ≈4,7–6,4 psid, dış tank ≈19–24 psid; boost pompaları ≈35.000 pph, 1 ve 5 no. transfer pompaları ≈17.500 pph, FFP ≈70.000 pph; #3 pompa "ters uçuş" pompası.' },
];
export const srcN = id => (SOURCES.find(s=>s.id===id)||{}).n;

// conf: 'c1' = özellik doğrudan F-16 kaynağında geçiyor; 'c2' = genel uçak boost pompası mimarisi / temsili
export const PARTS = {
  housing:{ tr:'Motor gövdesi', en:'Motor housing (explosion-proof)', conf:'c2',
    f:'Elektrik motorunu taşır ve çevreler. Yakıt buharı bulunan tank ortamında iç arızadan doğabilecek kıvılcım/alevin dışarı çıkmasını önleyecek patlama-geçirmez (explosion-proof) yapıdadır.',
    d:'Tank içi pompalarda motor genellikle yakıta batık (fuel-flooded) çalışır; yakıt hem soğutur hem yağlar. Kanatçıklar modelde görsel amaçlıdır.', src:['eaton-9602','eaton-vf'] },
  stator:{ tr:'Stator sargıları', en:'3-phase stator windings', conf:'c1',
    f:'200 VAC, 3 faz, 400 Hz besleme ile döner manyetik alan üretir; rotoru indüksiyonla döndürür.',
    d:'Senkron hız n = 120·f / p. 400 Hz’de 4 kutup → 12.000 rpm, 6 kutup → 8.000 rpm. F-16 pompasının kutup sayısı/devri açık kaynakta yok; bu modelde 4 kutup varsayıldı (temsili).', src:['eaton-f16','eaton-9602'] },
  thermal:{ tr:'Termal koruyucu', en:'Thermal protector', conf:'c2',
    f:'Sargı sıcaklığı aşırı yükselirse AC beslemeyi keserek motoru korur (ör. kuru çalışma, faz kaybı).',
    d:'Eaton tank pompası veri sayfalarında tanımlanan özelliktir. Simülasyondaki açma eşiği (≈150 °C) temsilidir.', src:['eaton-9602','eaton-vf'] },
  rotor:{ tr:'Rotor (sincap kafesli)', en:'Squirrel-cage rotor / armature', conf:'c2',
    f:'Asenkron (indüksiyon) motorun dönen kısmı. Stator alanının biraz gerisinde (kayma / slip) döner; yük ve gerilim düştükçe kayma artar.',
    d:'Fırçasız olduğundan yakıt ortamında kıvılcım riski düşüktür. Rotor çubukları ve uç halkaları modelde gösterilmiştir.', src:['eaton-9602'] },
  shaft:{ tr:'Mil', en:'Shaft', conf:'c2',
    f:'Rotordan aldığı torku indüktör ve çarka iletir. İki rulman arasında taşınır.', d:'', src:[] },
  'bearing-r':{ tr:'Arka rulman', en:'Rear bearing (fuel-lubricated)', conf:'c2',
    f:'Milin motor tarafını taşır. Yakıtla yağlanan ve soğutulan rulman tipiktir.', d:'Kuru çalışmada yağlama/soğutma azalır; bu yüzden üreticiler "dry-run capability" ve termal koruma belirtir.', src:['eaton-9602'] },
  'bearing-f':{ tr:'Ön rulman', en:'Front bearing (fuel-lubricated)', conf:'c2',
    f:'Milin pompa tarafını taşır; çarkın eksenel/radyal yüklerini karşılar.', d:'', src:['eaton-9602'] },
  seal:{ tr:'Salmastra ve O-ringler', en:'Shaft seal & O-rings', conf:'c2',
    f:'Pompa kademesi ile motor bölmesi arasındaki ve dış ortama karşı sızdırmazlığı sağlar.',
    d:'Islak (fuel-flooded) motorlu tasarımlarda yakıt motor içinden kontrollü olarak dolaşır; kuru motorlu tasarımlarda mil salmastrası motoru yakıttan ayırır. F-16 boost pompasının hangisi olduğu açık kaynakta belirtilmemiştir.', src:['eaton-9602'] },
  impeller:{ tr:'Çark', en:'Centrifugal impeller', conf:'c1',
    f:'Yakıta kinetik enerji verip merkezden dışa doğru savurarak basınç artışı sağlar. Eaton broşürü F-16 boost pompasını "santrifüj boost pompası" olarak tanımlar.',
    d:'Benzerlik yasaları: debi ∝ devir, basınç artışı ∝ devir². Nominal nokta (kaynak): 73 gpm @ 11 veya 17 psid. Simülasyon 17 psid noktasını kullanır.', src:['eaton-f16','asme-sizing'] },
  inducer:{ tr:'İndüktör', en:'Inducer', conf:'c2',
    f:'Çarkın önündeki helisel kanatlı kademe. Düşük giriş basıncında (düşük NPSH) yakıtı ön-basınçlandırarak çarkta kavitasyonu geciktirir.',
    d:'Yüksek irtifa ve sıcak yakıtta çözünmüş gaz ayrışması iki fazlı akışa yol açar; boost pompalarında indüktör bu nedenle yaygındır.', src:['nasa-1970','asme-sizing','cranfield-cav'] },
  volute:{ tr:'Salyangoz / pompa gövdesi', en:'Volute / pump housing', conf:'c2',
    f:'Çarktan çıkan yüksek hızlı yakıtı toplar, kesiti genişleyen spiral kanalda hızı basınca dönüştürür ve çıkışa yönlendirir.',
    d:'Eloksallı alüminyum döküm gövde (referans fotoğraftaki gri kafa) temsil edilmiştir.', src:['asme-sizing'] },
  inlet:{ tr:'Çift giriş portu', en:'Dual inlet ports (+G / −G)', conf:'c1',
    f:'Eaton’a göre F-16 boost pompasının çift girişli yapısı hem pozitif hem negatif G’de beslemeyi mümkün kılar. Modelde eksenel ana giriş + yan giriş gösterilmiştir.',
    d:'Girişlerin gerçek yerleşimi/geometrisi kaynakta yoktur; temsili.', src:['eaton-f16','f16net'] },
  screen:{ tr:'Giriş süzgeci', en:'Inlet screen', conf:'c2',
    f:'Pompaya yabancı madde girmesini engeller. Tıkandığında giriş basıncı düşer, debi azalır ve kavitasyon eğilimi artar ("Tıkalı giriş süzgeci" senaryosu).',
    d:'Elek boyutu/konumu temsilidir.', src:[] },
  outlet:{ tr:'Çıkış portu', en:'Outlet port & flange', conf:'c2',
    f:'Basınçlandırılmış yakıtı motor besleme hattına (engine feed line) verir; buradan FFP’ye ve motor ana yakıt pompasına gider.',
    d:'F-16’da rezervuar tanklarındaki boost pompaları yakıtı FFP üzerinden motora gönderir.', src:['bms-dash1','eaton-f16'] },
  check:{ tr:'Çek valf', en:'Check valve (flapper)', conf:'c2',
    f:'Pompa durduğunda veya paralel çalışan diğer pompanın basıncı yüksek olduğunda geri akışı önler.',
    d:'F-16 FFP’sinde swing check valf kullanımı ve FFP arızasında check valfli bypass hatları kaynaklarda geçer; boost pompasının kendi çek valfi temsilidir.', src:['derco-ffp','bms-dash1','eaton-vf'] },
  relief:{ tr:'Basınç tahliye / regülatör valfi', en:'Pressure relief / regulator valve', conf:'c2',
    f:'Çıkış basıncını sınırlar; ayar saplaması ve kontra somunu ile ayarlanır (referans fotoğraftaki üst kapak).',
    d:'Eaton F-16 broşürü sistemde ayrı "fuel pressure & dump valves" listeler; boost pompasına tümleşik bir regülatör olup olmadığı açık kaynakta yoktur. Temsili.', src:['eaton-f16'] },
  connector:{ tr:'Elektrik konnektörü', en:'Electrical connector (3-phase)', conf:'c2',
    f:'3 faz besleme (A-B-C) ve topraklama bağlantısı. Askeri tip dairesel konnektör temsil edilmiştir.',
    d:'Not: referans fotoğraftaki 2 telli konnektör DC pompalara özgüdür; F-16 boost pompası 200 VAC 3 faz olduğundan modelde çok pimli konnektör kullanıldı.', src:['eaton-f16'] },
  plate:{ tr:'Veri plakası', en:'Data / name plate', conf:'c2',
    f:'Parça no (P/N), seri no, besleme ve performans bilgilerini taşır.',
    d:'Modeldeki plaka kurgusaldır ve gerçek bir P/N içermez. Kaynaktaki nominal değer: 200 VAC 400 Hz, 73 gpm @ 11/17 psid.', src:['eaton-f16'] },
};

export const SYSTEM_HTML = `
<svg viewBox="0 0 340 250" font-family="ui-monospace,monospace" font-size="8.5">
  <defs><marker id="ar" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L8,4L0,8z" fill="#38d6ff"/></marker></defs>
  <g fill="#0d1622" stroke="#2c4660">
    <rect x="6" y="10" width="78" height="26" rx="4"/><rect x="6" y="56" width="78" height="26" rx="4"/>
    <rect x="6" y="140" width="78" height="26" rx="4"/><rect x="6" y="186" width="78" height="26" rx="4"/>
    <rect x="110" y="56" width="90" height="26" rx="4" stroke="#38d6ff"/><rect x="110" y="140" width="90" height="26" rx="4" stroke="#38d6ff"/>
    <rect x="226" y="96" width="70" height="30" rx="4"/><rect x="226" y="160" width="106" height="30" rx="4"/>
  </g>
  <g fill="#cfe2f3">
    <text x="45" y="26" text-anchor="middle">Sağ kanat (+dış)</text><text x="45" y="72" text-anchor="middle">F-1 → F-2</text>
    <text x="45" y="156" text-anchor="middle">A-1</text><text x="45" y="202" text-anchor="middle">Sol kanat (+dış)</text>
    <text x="155" y="67" text-anchor="middle">İleri rezervuar</text><text x="155" y="77" text-anchor="middle" fill="#38d6ff">boost pompaları</text>
    <text x="155" y="151" text-anchor="middle">Arka rezervuar</text><text x="155" y="161" text-anchor="middle" fill="#38d6ff">boost pompaları</text>
    <text x="261" y="109" text-anchor="middle">FFP</text><text x="261" y="120" text-anchor="middle" fill="#8a9bb0">Hidrolik A</text>
    <text x="279" y="173" text-anchor="middle">Motor ana yakıt pompası</text><text x="279" y="184" text-anchor="middle" fill="#8a9bb0">santrifüj + dişli</text>
  </g>
  <g stroke="#38d6ff" stroke-width="1.3" fill="none" marker-end="url(#ar)">
    <path d="M45 36V54"/><path d="M84 69H108"/><path d="M45 186V168"/><path d="M84 153H108"/>
    <path d="M200 69C215 69 215 104 224 108"/><path d="M200 153C215 153 215 118 224 114"/><path d="M261 126V158"/>
  </g>
  <text x="6" y="238" fill="#ffb547">İleri sistem (üst) · Arka sistem (alt) — basitleştirilmiş şema</text>
</svg>
<p><b>Bu simülasyonun konusu:</b> rezervuar tanklarındaki <b>elektrikli santrifüj boost pompası</b>. Yakıt kanat ve gövde tanklarından sifon/transfer ile rezervuarlara gelir; boost pompaları yakıtı motor besleme hattından <b>FFP</b>’ye (fuel flow proportioner), oradan motor ana yakıt pompasına gönderir. <a href="#" class="srcref" data-src="bms-dash1">[3]</a></p>
<p><b>FFP:</b> tek hidrolik motorla (hidrolik A sistemi) tahrikli iki pozitif deplasmanlı kanatlı pompa; ileri ve arka tanklardan eşit yakıt çekerek ağırlık merkezini korur ve elektrikli boost pompasının yedeğidir. <a href="#" class="srcref" data-src="eaton-f16">[1]</a><a href="#" class="srcref" data-src="derco-ffp">[2]</a><a href="#" class="srcref" data-src="bms-dash1">[3]</a></p>
<p><b>ENG FEED</b> anahtarı NORM’da tüm elektrikli pompalar çalışır; OFF’ta elektrikli pompalar durur, besleme FFP ve sifon ile sürer. <a href="#" class="srcref" data-src="bms-dash1">[3]</a></p>
<table style="width:100%;font-size:11px;border-collapse:collapse;margin-top:6px">
<tr style="color:#8a9bb0"><td>Pompa</td><td>Kaynak değeri</td><td></td></tr>
<tr><td>Boost pompası</td><td>73 gpm @ 11 / 17 psid, 200 VAC 400 Hz</td><td><a href="#" class="srcref" data-src="eaton-f16">[1]</a></td></tr>
<tr><td>Transfer pompası</td><td>37 gpm @ 14 psid, 200 VAC 400 Hz</td><td><a href="#" class="srcref" data-src="eaton-f16">[1]</a></td></tr>
<tr><td>Saha bilgisi</td><td>boost ≈35.000 pph, FFP ≈70.000 pph, iç tank ≈4,7–6,4 psid <i>(gayriresmî)</i></td><td><a href="#" class="srcref" data-src="f16net">[9]</a></td></tr>
</table>
<p class="note">73 gpm × ~6,7 lb/gal (JP-8) × 60 ≈ 29.000 pph — saha bilgisindeki mertebeyle uyumlu. Yoğunluk yaklaşık değerdir.</p>`;
