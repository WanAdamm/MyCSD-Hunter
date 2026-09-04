export const campusZones = {
  A: { name: 'Recreation', nameMs: 'Rekreasi', color: '#68a84b' },
  B: { name: 'Heritage', nameMs: 'Warisan', color: '#e3b51c' },
  C: { name: 'Administration & humanities', nameMs: 'Pentadbiran & kemanusiaan', color: '#8475aa' },
  D: { name: 'Arts', nameMs: 'Kesenian', color: '#a73578' },
  E: { name: 'Education & management', nameMs: 'Pendidikan & pengurusan', color: '#d59b31' },
  F: { name: 'Sungai Dua', nameMs: 'Sungai Dua', color: '#e27862' },
  G: { name: 'Sciences', nameMs: 'Sains', color: '#2575a5' },
  H: { name: 'Student residences', nameMs: 'Desasiswa', color: '#82a93e' },
  J: { name: 'Research & pharmacy', nameMs: 'Penyelidikan & farmasi', color: '#d7668d' },
  K: { name: 'Sports & residences', nameMs: 'Sukan & desasiswa', color: '#736b63' },
  L: { name: 'Campus services', nameMs: 'Perkhidmatan kampus', color: '#568d91' },
  M: { name: 'Restu, Saujana & Tekun', nameMs: 'Restu, Saujana & Tekun', color: '#c53084' },
};

// Affine transformation mapping map percentages (x, y) to real-world GPS coordinates
// Derived from surveyed USM campus landmarks (MGTF B01, DTSP G01, Stadium K14)
export const toCoordinates = (x, y) => {
  const lat = 5.363412 + 0.0000105 * x - 0.00014045 * y;
  const lng = 100.286899 + 0.00025023 * x + 0.00000707 * y;
  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
  };
};

export const getGoogleMapsUrl = (place) => {
  if (!place || typeof place.lat !== 'number' || typeof place.lng !== 'number') return '#';
  return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
};

export const getPlaceName = (place, lang = 'en') => {
  if (!place) return '';
  return lang === 'ms' && place.nameMs ? place.nameMs : place.name;
};

export const getZoneName = (zoneCode, lang = 'en') => {
  const zone = campusZones[zoneCode];
  if (!zone) return '';
  return lang === 'ms' && zone.nameMs ? zone.nameMs : zone.name;
};

const location = (code, name, nameMs, x, y, aliases = '') => {
  const coords = toCoordinates(x, y);
  return {
    code,
    name,
    nameMs,
    zone: code[0],
    x,
    y,
    aliases,
    lat: coords.lat,
    lng: coords.lng,
  };
};

// Coordinates are percentages of the official 1919 x 1357 campus guide.
export const campusLocations = [
  location('A01', 'Guard House (Jalan Sultan Azlan Shah)', 'Pondok Pengawal (Jalan Sultan Azlan Shah)', 92.7, 35.8, 'Entrance Batu Uban Pintu Masuk Batu Uban'),
  location('A03', 'Cafeteria / Pavilion', 'Kafeteria / Astaka', 86.9, 35.6),
  location('A05', 'USM Staff Sports Club', 'Kelab Sukan Staf USM (KSSUSM)', 91.3, 41.6),
  location('A10', 'Swimming Pool Complex', 'Kompleks Kolam Renang', 82.2, 40.3),
  location('A12', 'Badminton Complex', 'Kompleks Badminton', 85.6, 45.3),

  location('B01', 'Tuanku Fauziah Museum & Art Gallery', 'Muzium & Galeri Tuanku Fauziah (MGTF)', 78.8, 24.3, 'Muzium dan Galeri Tuanku Fauziah MGTF'),
  location('B02', "Vice-Chancellor's Residence", 'Kediaman Naib Canselor', 81.4, 26.9),
  location('B03', "Chancellor's Lodge", "Rumah Tetamu Canselor (Chancellor's Lodge)", 82.9, 24.7),
  location('B05', 'Guest House', 'Rumah Tetamu (Guest House)', 81.7, 18.4),
  location('B11', 'ECD-Hub', 'Pusat Perkembangan Awal Kanak-Kanak (ECD-Hub)', 73.0, 20.0),
  location('B14', 'Guard House (Minden Heights)', 'Pondok Pengawal (Minden Heights)', 94.8, 12.5, 'Entrance Minden Heights Pintu Masuk Minden Heights'),
  location('B15', 'Centre for Archaeological Research Malaysia', 'Pusat Penyelidikan Arkeologi Global Malaysia (PPAG)', 79.1, 21.4, 'Archaeology Arkeologi PPAG'),

  location('C02', "Women's Development Research Centre (KANITA)", 'Pusat Penyelidikan Pembangunan Wanita (KANITA)', 74.4, 41.2, 'KANITA'),
  location('C03', 'Corporate and Sustainable Development Division', 'Bahagian Pembangunan Korporat dan Kelestarian', 73.0, 39.9, 'Healthy Campus Secretariat RCE Kelestarian'),
  location('C04', 'Bursary Department', 'Jabatan Bendahari', 72.0, 37.3, 'Revenue Student Financial Section Kewangan Pelajar'),
  location('C05', 'Research and Education for Peace Unit', 'Unit Penyelidikan dan Pendidikan untuk Perdamaian (REPUSM)', 70.6, 33.7, 'REPUSM ISDEV Islamic Development Management Studies'),
  location('C06', 'School of Social Sciences', 'Pusat Pengajian Sains Kemasyarakatan (PPSK)', 68.9, 34.9, 'Sains Kemasyarakatan'),
  location('C08', 'Lecture Theatres A, B & C', 'Dewan Kuliah A, B & C (DK A, B, C)', 69.8, 42.2, 'DKA DKB DKC'),
  location('C09', 'USM International', 'Pusat Mobiliti & Kerjasama Antarabangsa (IMCC)', 72.4, 43.3, 'AIDSA AARG IMCC USM International'),
  location('C15', 'Centre for Co-Curriculum Programmes', 'Pusat Rancangan Kokurikulum', 65.0, 35.7, 'Internal Audit Unit Unit Audit Dalam Kokurikulum'),
  location('C18', 'Post Office', 'Pejabat Pos', 65.5, 49.3, 'Pos Malaysia'),
  location('C20', 'School of Humanities', 'Pusat Pengajian Ilmu Kemanusiaan (PPIK)', 67.8, 40.4, 'Kemanusiaan'),
  location('C21', 'University Conference Hall', 'Dewan Persidangan Universiti (DPU)', 75.3, 35.4, 'DPU Dewan Persidangan Universiti'),
  location('C22', 'Chancellory Building', 'Bangunan Canselori', 76.1, 38.7, "Vice-Chancellor's Office Registry Bursary Public Relations Pejabat Naib Canselor Pendaftar"),
  location('C23', 'Lecture Theatres SK1, SK2, SK3 & SK4', 'Dewan Kuliah SK1, SK2, SK3 & SK4', 68.9, 38.5, 'Social Science Complex Kompleks Sains Kemasyarakatan'),
  location('C24', 'Institute of Graduate Studies', 'Institut Pengajian Siswazah (IPS)', 69.6, 45.7, 'IPS Pengajian Siswazah'),

  location('D01', 'Advancement Office', 'Pejabat Pemajuan Alumni (Advancement Office)', 78.7, 43.3, 'Alumni'),
  location('D03', 'Centre for Policy Research and International Studies (CenPRIS)', 'Pusat Penyelidikan Dasar dan Kajian Antarabangsa (CenPRIS)', 82.5, 46.5, 'Right Livelihood College CenPRIS'),
  location('D04', 'Astronomy & Atmospheric Science Research Unit', 'Unit Penyelidikan Sains Astronomi dan Atmosfera', 83.9, 48.6, 'Astronomi'),
  location('D05', 'Students Affairs & Division', 'Bahagian Hal Ehwal Pembangunan Pelajar & Alumni (BHEPA)', 83.6, 51.5, 'BHEPA Hal Ehwal Pelajar'),
  location('D10', 'School of Languages, Literacies and Translation', 'Pusat Pengajian Bahasa, Literasi dan Terjemahan (PPBLT)', 81.8, 52.2, 'PPBLT Bahasa Terjemahan'),
  location('D11', 'Centre for Instructional Technology & Multimedia', 'Pusat Teknologi Pengajaran dan Multimedia (PTPM)', 79.8, 46.6, 'PTPM Multimedia'),
  location('D12', 'Banks', 'Kompleks Bank', 76.0, 45.9, 'ATM Bank Islam Bank Simpanan Nasional'),
  location('D13', 'School of Communication', 'Pusat Pengajian Komunikasi', 78.4, 49.4, 'Komunikasi'),
  location('D18', 'National APEX Development Indicators Centre (NADI)', 'Pusat Penunjuk Pembangunan APEX Negara (NADI)', 79.7, 51.0, 'NADI'),
  location('D19', 'Cooperative Shop', 'Kedai Koperasi Siswa', 69.7, 48.5, 'Kedai Koperasi Mart'),
  location('D20', 'School of Arts', 'Pusat Pengajian Seni', 71.8, 52.0, 'Graha Seni Balai Persiban Seni'),
  location('D31', 'Lecture Theatres D, E & F', 'Dewan Kuliah D, E & F (DK D, E, F)', 78.3, 55.9, 'DKD DKE DKF'),
  location('D34', 'USM Press', 'Penerbit Universiti Sains Malaysia (Penerbit USM)', 80.8, 55.2, 'Penerbit USM Percetakan'),

  location('E39', 'School of Distance Education', 'Pusat Pengajian Pendidikan Jarak Jauh (PPPJJ)', 67.7, 57.9, 'PPPJJ Jarak Jauh'),
  location('E41', 'Hamzah Sendut Library 2', 'Perpustakaan Hamzah Sendut 2 (PHS 2)', 65.7, 61.3, 'PHS2 Perpustakaan 2'),
  location('E42', 'The Cultural Hall', 'Dewan Budaya', 67.2, 51.7, 'Dewan Budaya Student Development Advisory Unit'),
  location('E43', 'School of Educational Studies', 'Pusat Pengajian Ilmu Pendidikan (PPIP)', 70.9, 58.2, 'Basic Education Research Unit PPIP Pendidikan'),
  location('E44', 'Lecture Theatre Z', 'Dewan Kuliah Z (DK Z)', 71.8, 55.7, 'DKZ Dewan Kuliah Z'),
  location('E45', 'School of Management', 'Pusat Pengajian Pengurusan', 73.5, 61.3, 'Pengurusan SOM'),
  location('E46', 'Eureka Complex', 'Kompleks Eureka', 63.0, 63.7, 'AMDI CETREE CenPRIS NITC USAINS Eureka'),
  location('E49', 'School of Housing, Building & Planning', 'Pusat Pengajian Perumahan, Bangunan dan Perancangan (HBP)', 77.7, 61.5, 'Graduate School of Business HBP GSB Perumahan'),

  location('F01', 'Guard House (Jalan Sungai Dua)', 'Pondok Pengawal (Pintu Masuk Sungai Dua)', 63.3, 71.7, 'Entrance Sungai Dua Pintu Sungai Dua'),
  location('F02', 'Islamic Centre', 'Pusat Islam USM (Masjid USM)', 57.8, 67.8, 'Secretariat for Islamic Philosophy and Science Masjid USM Pusat Islam'),
  location('F27', "Harapan Students' Residence", 'Desasiswa Harapan', 50.5, 59.9, 'Desasiswa Harapan Hostel'),

  location('G01', 'Tuanku Syed Putra Hall (Main Hall)', 'Dewan Tuanku Syed Putra (DTSP / Dewan Utama)', 63.3, 51.1, 'DTSP Dewan Tuanku Syed Putra Dewan Utama Convo Hall'),
  location('G02', 'Hamzah Sendut Library 1', 'Perpustakaan Hamzah Sendut 1 (PHS 1)', 63.2, 45.1, 'PHS1 Perpustakaan Utama'),
  location('G02A', 'Centre for Global Sustainability Studies (CGSS)', 'Pusat Kajian Kelestarian Global (CGSS)', 63.0, 47.0, 'CGSS Kelestarian Global'),
  location('G03', 'Lecture Theatres G-R', 'Dewan Kuliah G-R (DK G-R)', 59.3, 47.8, 'DKG DKH DKJ DKK DKL DKM DKN DKP DKQ DKR'),
  location('G05', 'Technical Facilities Centre', 'Pusat Kemudahan Teknikal', 58.6, 41.3, 'Kemudahan Teknikal'),
  location('G06', 'School of Physics', 'Pusat Pengajian Sains Fizik', 59.7, 39.2, 'Sains Fizik Fizik'),
  location('G07', 'School of Industrial Technology', 'Pusat Pengajian Teknologi Industri (PPTI)', 59.4, 44.3, 'PPTI Teknologi Industri'),
  location('G08', 'School of Biological Sciences', 'Pusat Pengajian Sains Kajihayat', 56.9, 54.1, 'Vector Control Research Unit Sains Biologi Kajihayat'),
  location('G09', 'School of Chemical Sciences', 'Pusat Pengajian Sains Kimia', 54.8, 59.0, 'Sains Kimia Kimia'),
  location('G23', 'Biocrystallography and Structural Bioinformatics Laboratory', 'Makmal Biokristalografi dan Bioinformatik Struktur', 57.2, 50.8, 'Makmal Biokristalografi'),
  location('G27', 'Lecture Theatres S, T, U & V', 'Dewan Kuliah S, T, U & V (DK S, T, U, V)', 57.7, 49.5, 'Computer Sciences Mathematical Sciences NAV6 DKS DKT DKU DKV'),

  location('H10', "Bakti Permai Students' Residence", 'Desasiswa Bakti Permai', 54.3, 43.6, 'Desasiswa Bakti Permai Bakti Hostel'),
  location('H20-24', 'Cahaya Complex', 'Kompleks Cahaya', 59.7, 31.4, 'Student Affairs Development Division BHEPA Kompleks Cahaya'),
  location('H27', 'Kindergarten, Cooperative Minden', 'Tadika Koperasi Minden', 57.8, 19.9, 'Tadika Minden'),
  location('H29', 'Wellness Centre', 'Pusat Sejahtera (Pusat Kesihatan)', 61.8, 29.1, 'Pusat Sejahtera Klinik Kesihatan Pelajar'),
  location('H33', "Cahaya Gemilang Students' Residence", 'Desasiswa Cahaya Gemilang', 65.9, 27.3, 'Desasiswa Cahaya Gemilang Hostel'),
  location('H38', "Students' Family Unit", 'Unit Keluarga Pelajar', 62.7, 19.4, 'Keluarga Pelajar Flat'),
  location('H51', "International Students' Residence", 'Desasiswa Antarabangsa', 55.0, 35.9, 'Desasiswa Antarabangsa Hostel'),
  location('H53', 'Institute for Research in Molecular Medicine (INFORMM)', 'Institut Penyelidikan Perubatan Molekul (INFORMM)', 48.8, 55.1, 'INFORMM'),

  location('J01', 'School of Pharmaceutical Sciences', 'Pusat Pengajian Sains Farmasi', 45.5, 45.5, 'Farmasi PPSF'),
  location('J02', 'Centre for Drug Research', 'Pusat Penyelidikan Dadah dan Ubat-Ubatan', 46.1, 50.1, 'Dadah Ubat Penyelidikan'),
  location('J06', 'Office of Research Platform', 'Pejabat Platform Penyelidikan', 44.0, 51.4, 'Platform Penyelidikan'),
  location('J07', 'National Poison Centre', 'Pusat Racun Negara (PRN)', 43.8, 53.1, 'PRN Racun Negara'),
  location('J08', 'Lecture Theatre X', 'Dewan Kuliah X (DK X)', 42.4, 52.9, 'DKX Dewan Kuliah X'),
  location('J09', 'Lecture Theatre Y', 'Dewan Kuliah Y (DK Y)', 41.9, 50.4, 'DKY Dewan Kuliah Y'),
  location('J15', 'Doping Control Centre', 'Pusat Kawalan Doping', 44.6, 43.0, 'Kawalan Doping'),

  location('K10', "Aman Damai Students' Residence", 'Desasiswa Aman Damai', 34.7, 65.4, 'Desasiswa Aman Damai Hostel'),
  location('K14', 'Athletics Stadium', 'Stadium Olahraga USM', 24.4, 67.2, 'Stadium USM Padang'),
  location('K17', 'Guard House (Jalan Bukit Gambier)', 'Pondok Pengawal (Pintu Masuk Bukit Gambier)', 22.0, 62.0, 'Entrance Bukit Gambier Pintu Bukit Gambir'),
  location('K18/19', "Postgraduates' Family Unit", 'Unit Keluarga Pascasiswazah', 34.5, 74.0, 'Unit Pascasiswazah'),
  location('K20', 'Hockey Stadium', 'Stadium Hoki USM', 28.3, 65.4, 'Stadium Hoki Padang Astroturf'),
  location('K22', 'Tennis Complex / Pavilion', 'Kompleks Tenis / Astaka', 21.6, 75.0, 'Gelanggang Tenis Astaka'),

  location('L01', 'Development Office', 'Jabatan Pembangunan & Pengurusan Fasiliti', 38.0, 57.7, 'Jabatan Pembangunan Fasiliti'),
  location('L06', "Indah Kembara Students' Residence", 'Desasiswa Indah Kembara', 33.7, 57.6, 'Desasiswa Indah Kembara Hostel'),
  location('L15', 'Animal House', 'Rumah Haiwan Makmal', 26.3, 46.5, 'Rumah Haiwan'),
  location('L17', 'Main Students Hall', 'Dewan Utama Pelajar (DUP)', 26.4, 50.1, 'DUP Dewan Utama Pelajar'),
  location('L18', 'Pelapes Complex', 'Kompleks PALAPES', 24.9, 52.1, 'PALAPES ROTU Kompleks Pelapes'),
  location('L21', 'Security Department', 'Jabatan Keselamatan', 40.9, 57.7, 'Keselamatan Polis Bantuan'),

  location('M01', "Restu Students' Residence", 'Desasiswa Restu', 4.4, 51.7, 'Desasiswa Restu RST Hostel'),
  location('M03', "Saujana Students' Residence", 'Desasiswa Saujana', 5.9, 53.9, 'Desasiswa Saujana RST Hostel'),
  location('M05', "Tekun Students' Residence", 'Desasiswa Tekun', 12.4, 58.7, 'Desasiswa Tekun RST Hostel'),
  location('M08', 'Main Residence Hall', 'Dewan Utama Desasiswa', 8.9, 49.5, 'Dewan RST'),
  location('M10', "Entrance Restu, Saujana and Tekun Students' Residence", 'Pintu Masuk Desasiswa Restu, Saujana dan Tekun', 7.8, 67.0, 'Entrance RST Pintu Masuk RST'),
];
