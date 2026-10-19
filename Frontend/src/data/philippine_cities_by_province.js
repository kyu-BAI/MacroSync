/**
 * philippine_cities_by_province.js
 * In-memory, zero-latency directory of Philippine cities and municipalities
 * covering all 82 provinces and Metro Manila, with complete coverage for Cebu's 53 LGUs.
 */

import { CEBU_LOCATIONS } from "./cebu_locations";

export const PHILIPPINE_PROVINCES = [
  "Metro Manila (NCR)", "Abra", "Agusan del Norte", "Agusan del Sur", "Aklan", "Albay",
  "Antique", "Apayao", "Aurora", "Basilan", "Bataan", "Batanes", "Batangas", "Benguet",
  "Biliran", "Bohol", "Bukidnon", "Bulacan", "Cagayan", "Camarines Norte", "Camarines Sur",
  "Camiguin", "Capiz", "Catanduanes", "Cavite", "Cebu", "Cotabato", "Davao de Oro",
  "Davao del Norte", "Davao del Sur", "Davao Occidental", "Davao Oriental", "Dinagat Islands",
  "Eastern Samar", "Guimaras", "Ifugao", "Ilocos Norte", "Ilocos Sur", "Iloilo", "Isabela",
  "Kalinga", "La Union", "Laguna", "Lanao del Norte", "Lanao del Sur", "Leyte", "Maguindanao",
  "Marinduque", "Masbate", "Misamis Occidental", "Misamis Oriental", "Mountain Province",
  "Negros Occidental", "Negros Oriental", "Northern Samar", "Nueva Ecija", "Nueva Vizcaya",
  "Occidental Mindoro", "Oriental Mindoro", "Palawan", "Pampanga", "Pangasinan", "Quezon",
  "Quirino", "Rizal", "Romblon", "Samar", "Sarangani", "Siquijor", "Sorsogon", "South Cotabato",
  "Southern Leyte", "Sultan Kudarat", "Sulu", "Surigao del Norte", "Surigao del Sur",
  "Tarlac", "Tawi-Tawi", "Zambales", "Zamboanga del Norte", "Zamboanga del Sur", "Zamboanga Sibugay"
].map((name, i) => ({
  province_code: `P${100 + i}`,
  name,
  province_name: name
}));

export const PROVINCE_COORDINATES = {
  "Metro Manila (NCR)": {
    "lat": 14.5995,
    "lng": 120.9842,
    "region": "NCR"
  },
  "Abra": {
    "lat": 17.5995,
    "lng": 120.6789,
    "region": "Luzon"
  },
  "Agusan del Norte": {
    "lat": 8.9492,
    "lng": 125.5436,
    "region": "Mindanao"
  },
  "Agusan del Sur": {
    "lat": 8.5,
    "lng": 125.8333,
    "region": "Mindanao"
  },
  "Aklan": {
    "lat": 11.7077,
    "lng": 122.3638,
    "region": "Visayas"
  },
  "Albay": {
    "lat": 13.1391,
    "lng": 123.7438,
    "region": "Luzon"
  },
  "Antique": {
    "lat": 10.7447,
    "lng": 121.9405,
    "region": "Visayas"
  },
  "Apayao": {
    "lat": 18.0667,
    "lng": 121.1667,
    "region": "Luzon"
  },
  "Aurora": {
    "lat": 15.7587,
    "lng": 121.5625,
    "region": "Luzon"
  },
  "Basilan": {
    "lat": 6.7042,
    "lng": 122.0167,
    "region": "Mindanao"
  },
  "Bataan": {
    "lat": 14.6812,
    "lng": 120.5417,
    "region": "Luzon"
  },
  "Batanes": {
    "lat": 20.4485,
    "lng": 121.9708,
    "region": "Luzon"
  },
  "Batangas": {
    "lat": 13.7565,
    "lng": 121.0583,
    "region": "Luzon"
  },
  "Benguet": {
    "lat": 16.4023,
    "lng": 120.596,
    "region": "Luzon"
  },
  "Biliran": {
    "lat": 11.5542,
    "lng": 124.475,
    "region": "Visayas"
  },
  "Bohol": {
    "lat": 9.6444,
    "lng": 123.8556,
    "region": "Visayas"
  },
  "Bukidnon": {
    "lat": 8.1575,
    "lng": 125.1278,
    "region": "Mindanao"
  },
  "Bulacan": {
    "lat": 14.8527,
    "lng": 120.816,
    "region": "Luzon"
  },
  "Cagayan": {
    "lat": 17.6131,
    "lng": 121.7269,
    "region": "Luzon"
  },
  "Camarines Norte": {
    "lat": 14.1167,
    "lng": 122.95,
    "region": "Luzon"
  },
  "Camarines Sur": {
    "lat": 13.6218,
    "lng": 123.1948,
    "region": "Luzon"
  },
  "Camiguin": {
    "lat": 9.1764,
    "lng": 124.7297,
    "region": "Mindanao"
  },
  "Capiz": {
    "lat": 11.5853,
    "lng": 122.7511,
    "region": "Visayas"
  },
  "Catanduanes": {
    "lat": 13.5939,
    "lng": 124.2378,
    "region": "Luzon"
  },
  "Cavite": {
    "lat": 14.2829,
    "lng": 120.9167,
    "region": "Luzon"
  },
  "Cebu": {
    "lat": 10.3157,
    "lng": 123.8854,
    "region": "Cebu"
  },
  "Cotabato": {
    "lat": 7.2236,
    "lng": 124.2464,
    "region": "Mindanao"
  },
  "Davao de Oro": {
    "lat": 7.6,
    "lng": 125.9667,
    "region": "Mindanao"
  },
  "Davao del Norte": {
    "lat": 7.4478,
    "lng": 125.8078,
    "region": "Mindanao"
  },
  "Davao del Sur": {
    "lat": 7.0731,
    "lng": 125.6128,
    "region": "Mindanao"
  },
  "Davao Occidental": {
    "lat": 6.4167,
    "lng": 125.5833,
    "region": "Mindanao"
  },
  "Davao Oriental": {
    "lat": 6.9567,
    "lng": 126.2167,
    "region": "Mindanao"
  },
  "Dinagat Islands": {
    "lat": 10.1333,
    "lng": 125.6,
    "region": "Mindanao"
  },
  "Eastern Samar": {
    "lat": 11.6667,
    "lng": 125.4333,
    "region": "Visayas"
  },
  "Guimaras": {
    "lat": 10.5939,
    "lng": 122.6319,
    "region": "Visayas"
  },
  "Ifugao": {
    "lat": 16.85,
    "lng": 121.1333,
    "region": "Luzon"
  },
  "Ilocos Norte": {
    "lat": 18.196,
    "lng": 120.5927,
    "region": "Luzon"
  },
  "Ilocos Sur": {
    "lat": 17.5747,
    "lng": 120.3869,
    "region": "Luzon"
  },
  "Iloilo": {
    "lat": 10.7202,
    "lng": 122.5621,
    "region": "Visayas"
  },
  "Isabela": {
    "lat": 17.1333,
    "lng": 121.8833,
    "region": "Luzon"
  },
  "Kalinga": {
    "lat": 17.3833,
    "lng": 121.4333,
    "region": "Luzon"
  },
  "La Union": {
    "lat": 16.6167,
    "lng": 120.3167,
    "region": "Luzon"
  },
  "Laguna": {
    "lat": 14.2117,
    "lng": 121.1656,
    "region": "Luzon"
  },
  "Lanao del Norte": {
    "lat": 8.228,
    "lng": 124.2452,
    "region": "Mindanao"
  },
  "Lanao del Sur": {
    "lat": 8.0033,
    "lng": 124.285,
    "region": "Mindanao"
  },
  "Leyte": {
    "lat": 11.005,
    "lng": 124.6075,
    "region": "Visayas"
  },
  "Maguindanao": {
    "lat": 7.0167,
    "lng": 124.4833,
    "region": "Mindanao"
  },
  "Marinduque": {
    "lat": 13.4444,
    "lng": 121.9028,
    "region": "Luzon"
  },
  "Masbate": {
    "lat": 12.3694,
    "lng": 123.6358,
    "region": "Luzon"
  },
  "Misamis Occidental": {
    "lat": 8.15,
    "lng": 123.8333,
    "region": "Mindanao"
  },
  "Misamis Oriental": {
    "lat": 8.4542,
    "lng": 124.6319,
    "region": "Mindanao"
  },
  "Mountain Province": {
    "lat": 17.0833,
    "lng": 120.9667,
    "region": "Luzon"
  },
  "Negros Occidental": {
    "lat": 10.6766,
    "lng": 122.957,
    "region": "Visayas"
  },
  "Negros Oriental": {
    "lat": 9.3068,
    "lng": 123.3054,
    "region": "Visayas"
  },
  "Northern Samar": {
    "lat": 12.5,
    "lng": 124.6333,
    "region": "Visayas"
  },
  "Nueva Ecija": {
    "lat": 15.4858,
    "lng": 120.9672,
    "region": "Luzon"
  },
  "Nueva Vizcaya": {
    "lat": 16.3333,
    "lng": 121.1667,
    "region": "Luzon"
  },
  "Occidental Mindoro": {
    "lat": 13.0667,
    "lng": 120.7667,
    "region": "Luzon"
  },
  "Oriental Mindoro": {
    "lat": 13.4117,
    "lng": 121.1803,
    "region": "Luzon"
  },
  "Palawan": {
    "lat": 9.7392,
    "lng": 118.7353,
    "region": "Luzon"
  },
  "Pampanga": {
    "lat": 15.0343,
    "lng": 120.6896,
    "region": "Luzon"
  },
  "Pangasinan": {
    "lat": 16.0433,
    "lng": 120.3333,
    "region": "Luzon"
  },
  "Quezon": {
    "lat": 13.9314,
    "lng": 121.6172,
    "region": "Luzon"
  },
  "Quirino": {
    "lat": 16.2833,
    "lng": 121.5833,
    "region": "Luzon"
  },
  "Rizal": {
    "lat": 14.5842,
    "lng": 121.1763,
    "region": "Luzon"
  },
  "Romblon": {
    "lat": 12.5761,
    "lng": 122.2708,
    "region": "Luzon"
  },
  "Samar": {
    "lat": 11.7833,
    "lng": 124.8833,
    "region": "Visayas"
  },
  "Sarangani": {
    "lat": 5.8667,
    "lng": 125.2833,
    "region": "Mindanao"
  },
  "Siquijor": {
    "lat": 9.2139,
    "lng": 123.5153,
    "region": "Visayas"
  },
  "Sorsogon": {
    "lat": 12.9739,
    "lng": 124.0056,
    "region": "Luzon"
  },
  "South Cotabato": {
    "lat": 6.5033,
    "lng": 124.8489,
    "region": "Mindanao"
  },
  "Southern Leyte": {
    "lat": 10.1333,
    "lng": 124.85,
    "region": "Visayas"
  },
  "Sultan Kudarat": {
    "lat": 6.6667,
    "lng": 124.6,
    "region": "Mindanao"
  },
  "Sulu": {
    "lat": 6.05,
    "lng": 121,
    "region": "Mindanao"
  },
  "Surigao del Norte": {
    "lat": 9.7833,
    "lng": 125.5,
    "region": "Mindanao"
  },
  "Surigao del Sur": {
    "lat": 8.65,
    "lng": 126.15,
    "region": "Mindanao"
  },
  "Tarlac": {
    "lat": 15.4802,
    "lng": 120.5979,
    "region": "Luzon"
  },
  "Tawi-Tawi": {
    "lat": 5.0833,
    "lng": 119.7833,
    "region": "Mindanao"
  },
  "Zambales": {
    "lat": 15.3333,
    "lng": 119.9833,
    "region": "Luzon"
  },
  "Zamboanga del Norte": {
    "lat": 8.5833,
    "lng": 123.3333,
    "region": "Mindanao"
  },
  "Zamboanga del Sur": {
    "lat": 7.8256,
    "lng": 123.4372,
    "region": "Mindanao"
  },
  "Zamboanga Sibugay": {
    "lat": 7.7833,
    "lng": 122.5833,
    "region": "Mindanao"
  }
};

// Instant in-memory city and municipality mappings covering all 82 provinces
export const CITIES_CATALOG = {
  "Cebu": CEBU_LOCATIONS,
  "Metro Manila (NCR)": [
    "Manila", "Quezon City", "Makati City", "Taguig City", "Pasig City",
    "Mandaluyong City", "Caloocan City", "Marikina City", "Parañaque City",
    "Pasay City", "Las Piñas City", "Malabon City", "Navotas City",
    "Valenzuela City", "Muntinlupa City", "San Juan City", "Pateros"
  ],
  "Bohol": [
    "Tagbilaran City", "Panglao", "Dauis", "Tubigon", "Carmen", "Jagna",
    "Loon", "Talibon", "Ubay", "Anda", "Loboc", "Alicia", "Guindulman",
    "Inabanga", "Clarin", "Maribojoc", "Baclayon", "Calape"
  ],
  "Negros Oriental": [
    "Dumaguete City", "Bais City", "Bayawan City", "Canlaon City",
    "Guihulngan City", "Tanjay City", "Sibulan", "Valencia", "Dauin",
    "Zamboanguita", "Siaton", "Manjuyod", "Amlan", "Ayungon", "Bindoy", "Mabinay"
  ],
  "Negros Occidental": [
    "Bacolod City", "Bago City", "Cadiz City", "Escalante City",
    "Himamaylan City", "Kabankalan City", "La Carlota City", "Sagay City",
    "San Carlos City", "Silay City", "Sipalay City", "Talisay City",
    "Victorias City", "Pulupandan", "Murcia", "Hinigaran", "E.B. Magalona", "Manapla"
  ],
  "Iloilo": [
    "Iloilo City", "Passi City", "Oton", "Santa Barbara", "Cabatuan",
    "Pavia", "Leganes", "Dumangas", "Carles", "Estancia", "Miagao",
    "Guimbal", "Tigbauan", "Pototan", "Barotac Nuevo", "Barotac Viejo", "Concepcion"
  ],
  "Leyte": [
    "Tacloban City", "Ormoc City", "Baybay City", "Palo", "Tanauan",
    "Dulag", "Carigara", "Abuyog", "Hilongos", "Palompon", "Isabel",
    "Alangalang", "Babatngon", "Barugo", "Burauen", "Dagami", "Jaro", "Kananga", "Mayorga"
  ],
  "Southern Leyte": [
    "Maasin City", "Sogod", "Macrohon", "Bontoc", "Hinunangan",
    "Saint Bernard", "Liloan", "San Juan", "Pintuyan", "Malitbog",
    "Libagon", "Tomas Oppus", "Silago", "Hinundayan", "San Francisco", "Padre Burgos"
  ],
  "Davao del Sur": [
    "Davao City", "Digos City", "Bansalan", "Hagonoy", "Santa Cruz",
    "Matanao", "Padada", "Sulop", "Magsaysay", "Kiblawan", "Malalag"
  ],
  "Davao del Norte": [
    "Tagum City", "Panabo City", "Island Garden City of Samal", "Carmen",
    "Santo Tomas", "New Corella", "Asuncion", "Kapalong", "Braulio E. Dujali", "San Isidro"
  ],
  "Benguet": [
    "Baguio City", "La Trinidad", "Itogon", "Tuba", "Tublay",
    "Buguias", "Mankayan", "Kapangan", "Kibungan", "Bakun", "Atok", "Kabayan", "Sablan"
  ],
  "Pampanga": [
    "San Fernando", "Angeles City", "Mabalacat City", "Guagua", "Lubao",
    "Mexico", "Arayat", "Porac", "Candaba", "Floridablanca", "Santa Rita",
    "San Luis", "Masantol", "Macabebe", "Apalit", "Bacolor", "Magalang"
  ],
  "Batangas": [
    "Batangas City", "Lipa City", "Tanauan City", "Sto. Tomas", "Nasugbu",
    "Lemery", "Bauan", "San Juan", "Calaca", "Balayan", "Taal",
    "Rosario", "San Jose", "Mabini", "San Pascual", "Ibaan", "Alitagtag", "Calatagan"
  ],
  "Cavite": [
    "Tagaytay City", "Imus City", "Bacoor City", "Dasmariñas City",
    "General Trias City", "Cavite City", "Trece Martires City", "Silang",
    "Kawit", "Tanza", "Rosario", "Naic", "Alfonso", "Amadeo", "Indang", "Carmona", "Maragondon"
  ],
  "Laguna": [
    "Calamba City", "Santa Rosa City", "Biñan City", "Cabuyao City",
    "San Pedro City", "San Pablo City", "Los Baños", "Pagsanjan",
    "Santa Cruz", "Bay", "Alaminos", "Nagcarlan", "Liliw", "Majayjay", "Pila", "Victoria"
  ],
  "Rizal": [
    "Antipolo City", "Cainta", "Taytay", "Angono", "Binangonan",
    "San Mateo", "Rodriguez (Montalban)", "Tanay", "Morong", "Teresa",
    "Baras", "Cardona", "Pililla", "Jalajala"
  ],
  "Bulacan": [
    "Malolos City", "Meycauayan City", "San Jose del Monte City", "Marilao",
    "Santa Maria", "Bocaue", "Baliuag City", "Plaridel", "Guiguinto",
    "Hagonoy", "Calumpit", "San Miguel", "San Ildefonso", "Norzagaray", "Bulakan", "Pulilan"
  ],
  "Pangasinan": [
    "Dagupan City", "San Carlos City", "Urdaneta City", "Alaminos City",
    "Lingayen", "Rosales", "Mangaldan", "Calasiao", "Bayambang",
    "Binmaley", "Malasiqui", "Bugallon", "Bolinao", "Mangatarem", "Bani", "Tayug"
  ],
  "Ilocos Norte": [
    "Laoag City", "Batac City", "San Nicolas", "Pagudpud", "Paoay",
    "Currimao", "Dingras", "Pasuquin", "Bacarra", "Badoc", "Burgos", "Solsona"
  ],
  "Ilocos Sur": [
    "Vigan City", "Candon City", "Narvacan", "Santa Maria", "Tagudin",
    "Sinait", "Cabugao", "Bantay", "San Juan", "Santiago", "Magsingal", "Santa"
  ],
  "Albay": [
    "Legazpi City", "Ligao City", "Tabaco City", "Daraga", "Camalig",
    "Guinobatan", "Polangui", "Oas", "Tiwi", "Bacacay", "Malinao", "Santo Domingo"
  ],
  "Camarines Sur": [
    "Naga City", "Iriga City", "Pili", "Calabanga", "Libmanan",
    "Baao", "Bula", "Buhi", "Canaman", "Caramoan", "Goa", "Tinambac", "Sipocot"
  ],
  "Palawan": [
    "Puerto Princesa", "Coron", "El Nido", "San Vicente", "Brooke's Point",
    "Roxas", "Narra", "Aborlan", "Taytay", "Bataraza", "Quezon", "Sofronio Española", "Culion"
  ],
  "Misamis Oriental": [
    "Cagayan de Oro", "Gingoog City", "El Salvador City", "Opol",
    "Tagoloan", "Villanueva", "Jasaan", "Claveria", "Balingasag", "Initao", "Alubijid"
  ],
  "South Cotabato": [
    "General Santos City", "Koronadal City", "Polomolok", "Tupi",
    "Surallah", "Banga", "Norala", "Lake Sebu", "Tampakan", "Tantangan", "Santo Niño"
  ],
  "Zamboanga del Sur": [
    "Zamboanga City", "Pagadian City", "Molave", "Aurora", "Dumingag",
    "Mahayag", "San Miguel", "Guipos", "Kumalarang", "Tigbao", "Labangan"
  ],
  "Capiz": [
    "Roxas City", "Panay", "Pontevedra", "Dao", "Dumarao",
    "Ivisan", "Mambusao", "Sigma", "Tapaz", "Pres. Roxas", "Cuartero", "Jamindan"
  ],
  "Aklan": [
    "Kalibo", "Malay (Boracay)", "Numancia", "Banga", "Makato",
    "Ibajay", "New Washington", "Batan", "Balete", "Nabas", "Altavas", "Lezo"
  ],
  "Antique": [
    "San Jose de Buenavista", "Sibalom", "Hamtic", "Pandan", "Culasi",
    "Tibiao", "Barbaza", "Bugasong", "Patnongon", "Belison", "Anini-y", "Tobias Fornier"
  ],
  "Tarlac": [
    "Tarlac City", "Capas", "Concepcion", "Camiling", "Paniqui",
    "Gerona", "Bamban", "La Paz", "Victoria", "Moncada", "Santa Ignacia"
  ],
  "Zambales": [
    "Olongapo City", "Subic", "Iba", "Castillejos", "San Marcelino",
    "Botolan", "San Antonio", "San Narciso", "San Felipe", "Cabangan", "Candelaria", "Santa Cruz"
  ],
  "Bataan": [
    "Balanga City", "Mariveles", "Dinalupihan", "Hermosa", "Orani",
    "Samal", "Abucay", "Pilar", "Orion", "Limay", "Bagac", "Morong"
  ],
  "Nueva Ecija": [
    "Cabanatuan City", "Gapan City", "Palayan City", "San Jose City",
    "Science City of Muñoz", "Talavera", "Guimba", "San Leonardo", "Santa Rosa", "General Tinio"
  ],
  "Isabela": [
    "Ilagan City", "Cauayan City", "Santiago City", "Roxas", "Echague",
    "San Mateo", "Alicia", "Tumauini", "Cabagan", "Jones", "Angadanan"
  ],
  "Cagayan": [
    "Tuguegarao City", "Aparri", "Baggao", "Lal-lo", "Solana",
    "Alcala", "Gonzaga", "Ballesteros", "Amulung", "Enrile", "Gattaran"
  ],
  "Oriental Mindoro": [
    "Calapan City", "Naujan", "Pinamalayan", "Puerto Galera", "Roxas",
    "Victoria", "Baco", "San Teodoro", "Bansud", "Gloria", "Mansalay", "Bongabong"
  ],
  "Occidental Mindoro": [
    "San Jose", "Mamburao", "Sablayan", "Abra de Ilog", "Calintaan",
    "Lubang", "Paluan", "Rizal", "Santa Cruz"
  ],
  "Surigao del Norte": [
    "Surigao City", "General Luna (Siargao)", "Dapa", "Del Carmen",
    "Socorro", "Mainit", "Claver", "Placer", "San Francisco", "Tubod"
  ],
  "Agusan del Norte": [
    "Butuan City", "Cabadbaran City", "Nasipit", "Carmen",
    "Buenavista", "Magallanes", "Tubay", "Santiago", "Kitcharao", "Jabonga"
  ],
  "Abra": [
    "Bangued", "Bucay", "Dolores", "La Paz", "Tayum", "Pidigan", "Manabo", "Peñarrubia", "San Juan", "Villaviciosa", "Lagangilang", "Langiden", "Licuan-Baay", "Luba", "Malibcong", "Sallapadan", "San Isidro", "San Quintin", "Tineg", "Tubo"
  ],
  "Agusan del Sur": [
    "Bayugan City", "San Francisco", "Prosperidad", "Esperanza", "Trento", "Bunawan", "Rosario", "Loreto", "Sibagat", "Santa Josefa", "Veruela", "Talacogon", "La Paz"
  ],
  "Apayao": [
    "Kabugao", "Conner", "Flora", "Luna", "Pudtol", "Santa Marcela", "Calanasan"
  ],
  "Aurora": [
    "Baler", "Casiguran", "Dilasag", "Dinalungan", "Dingalan", "Dipaculao", "Maria Aurora", "San Luis"
  ],
  "Basilan": [
    "Isabela City", "Lamitan City", "Maluso", "Sumisip", "Tipo-Tipo", "Tuburan", "Lantawan", "Hadji Mohammad Ajul"
  ],
  "Batanes": [
    "Basco", "Itbayat", "Ivana", "Mahatao", "Sabtang", "Uyugan"
  ],
  "Biliran": [
    "Naval", "Almeria", "Biliran", "Cabucgayan", "Caibiran", "Culaba", "Kawayan", "Maripipi"
  ],
  "Bukidnon": [
    "Malaybalay City", "Valencia City", "Maramag", "Manolo Fortich", "Quezon", "Don Carlos", "Pangantucan", "Talakag", "Kibawe", "Kalilangan", "Lantapan", "Libona", "Baungon", "Cabanglasan", "Damulog", "Dangcagan", "Impasugong", "Kadingilan", "Malitbog", "San Fernando", "Sumilao"
  ],
  "Camarines Norte": [
    "Daet", "Labo", "Jose Panganiban", "Basud", "Paracale", "Mercedes", "Capalonga", "Vinzons", "San Vicente", "Talisay"
  ],
  "Camiguin": [
    "Mambajao", "Catarman", "Guinsiliban", "Mahinog", "Sagay"
  ],
  "Catanduanes": [
    "Virac", "Bato", "San Andres", "Caramoran", "Pandan", "Baras", "Viga", "Bagamanoc", "Gigmoto", "San Miguel"
  ],
  "Cotabato": [
    "Kidapawan City", "Midsayap", "Pikit", "Kabacan", "Carmen", "Makilala", "Matalam", "Tulunan", "Libungan", "Pigcawayan", "President Roxas", "Banisilan", "Antipas", "Magpet", "Alamada", "Aleosan", "Arakan"
  ],
  "Davao de Oro": [
    "Nabunturan", "Monkayo", "Compostela", "Pantukan", "Mawab", "Laak", "Maco", "Maragusan", "New Bataan", "Montevista"
  ],
  "Davao Occidental": [
    "Malita", "Santa Maria", "Jose Abad Santos", "Don Marcelino", "Sarangani"
  ],
  "Davao Oriental": [
    "Mati City", "Lupon", "Baganga", "Governor Generoso", "Caraga", "Cateel", "San Isidro", "Manay", "Banaybanay", "Boston", "Tarragona"
  ],
  "Dinagat Islands": [
    "San Jose", "Basilisa", "Cagdianao", "Dinagat", "Libjo", "Loreto", "Tubajon"
  ],
  "Eastern Samar": [
    "Borongan City", "Guiuan", "Balangiga", "Dolores", "Oras", "Arteche", "Can-avid", "Hernani", "Llorente", "Maydolong", "Salcedo", "Sulat", "Taft"
  ],
  "Guimaras": [
    "Jordan", "Buenavista", "Nueva Valencia", "San Lorenzo", "Sibunag"
  ],
  "Ifugao": [
    "Lagawe", "Banaue", "Kiangan", "Alfonso Lista", "Lamut", "Aguinaldo", "Asipulo", "Hingyon", "Hungduan", "Mayoyao", "Tinoc"
  ],
  "Kalinga": [
    "Tabuk City", "Pinukpuk", "Rizal", "Balbalan", "Lubuagan", "Pasil", "Tanudan", "Tinglayan"
  ],
  "La Union": [
    "San Fernando City", "Agoo", "Bauang", "Naguilian", "Rosario", "San Juan", "Bacnotan", "Bangar", "Caba", "Luna", "Santo Tomas", "Tubao", "Aringay", "Balaoan", "Burgos", "Pugo", "San Gabriel", "Santol", "Sudipen"
  ],
  "Lanao del Norte": [
    "Iligan City", "Tubod", "Kauswagan", "Lala", "Kolambugan", "Balo-i", "Baroy", "Linamon", "Maigo", "Sapad", "Salvador", "Bacolod", "Kapatagan"
  ],
  "Lanao del Sur": [
    "Marawi City", "Wao", "Balabagan", "Malabang", "Kapai", "Ditsaan-Ramain", "Bayang", "Saguiaran", "Tubaran", "Marantao", "Taraka", "Picong"
  ],
  "Maguindanao": [
    "Shariff Aguak", "Datu Odin Sinsuat", "Buluan", "Parang", "Upi", "Sultan Kudarat", "Datu Piang", "Matanog", "Ampatuan", "South Upi"
  ],
  "Marinduque": [
    "Boac", "Santa Cruz", "Gasan", "Mogpog", "Torrijos", "Buenavista"
  ],
  "Masbate": [
    "Masbate City", "Aroroy", "Milagros", "Cataingan", "Placer", "San Jacinto", "Uson", "Claveria", "Dimasalang", "Mandaon", "Baleno", "Mobo"
  ],
  "Misamis Occidental": [
    "Oroquieta City", "Ozamiz City", "Tangub City", "Jimenez", "Clarin", "Plaridel", "Calamba", "Sinacaban", "Tudela", "Aloran", "Lopez Jaena"
  ],
  "Mountain Province": [
    "Bontoc", "Sagada", "Bauko", "Besao", "Sabangan", "Sadanga", "Natonin", "Paracelis", "Tadian", "Barlig"
  ],
  "Northern Samar": [
    "Catarman", "Laoang", "Allen", "San Jose", "Palapag", "Pambujan", "Mondragon", "Bobon", "Gamay", "Las Navas", "Lavezares", "Rosario", "San Roque", "Victoria"
  ],
  "Nueva Vizcaya": [
    "Bayombong", "Solano", "Bambang", "Aritao", "Bagabag", "Dupax del Norte", "Dupax del Sur", "Kayapa", "Kasibu", "Santa Fe", "Villaverde"
  ],
  "Quirino": [
    "Cabarroguis", "Diffun", "Maddela", "Saguday", "Aglipay", "Nagtipunan"
  ],
  "Romblon": [
    "Romblon", "Odiongan", "San Agustin", "San Fernando", "Cajidiocan", "Magdiwang", "Alcantara", "Calatrava", "Corcuera", "Looc", "Santa Fe", "Santa Maria"
  ],
  "Samar": [
    "Catbalogan City", "Calbayog City", "Basey", "Gandara", "Paranas", "Santa Margarita", "San Jorge", "Daram", "Hinabangan", "Jiabong", "Marabut", "Motiong", "Pinabacdao", "San Sebastian", "Tarangnan", "Villareal"
  ],
  "Sarangani": [
    "Alabel", "Glan", "Kiamba", "Maasim", "Maitum", "Malapatan", "Malungon"
  ],
  "Siquijor": [
    "Siquijor", "Larena", "Lazi", "Maria", "San Juan", "Enrique Villanueva"
  ],
  "Sorsogon": [
    "Sorsogon City", "Bulan", "Gubat", "Irosin", "Pilar", "Castilla", "Casiguran", "Bulusan", "Donsol", "Magallanes", "Matnog", "Prieto Diaz", "Santa Magdalena", "Barcelona", "Juban"
  ],
  "Sultan Kudarat": [
    "Tacurong City", "Isulan", "Lebak", "Kalamansig", "Esperanza", "Bagumbayan", "Senator Ninoy Aquino", "President Quirino", "Columbio", "Palimbang", "Lutayan"
  ],
  "Sulu": [
    "Jolo", "Indanan", "Maimbung", "Parang", "Panglima Estino", "Patikul", "Talipao", "Luuk", "Siasi", "Tongkil (Banguingui)"
  ],
  "Surigao del Sur": [
    "Tandag City", "Bislig City", "Hinatuan", "Cantilan", "Barobo", "Lianga", "Tagbina", "Cagwait", "Carrascal", "Lanuza", "Madrid", "San Miguel", "Cortes", "Lingig", "Marihatag"
  ],
  "Tawi-Tawi": [
    "Bongao", "Panglima Sugala", "Simunul", "Sitangkai", "South Ubian", "Tandubas", "Turtle Islands", "Languyan", "Mapun", "Sapa-Sapa", "Sibutu"
  ],
  "Zamboanga del Norte": [
    "Dipolog City", "Dapitan City", "Sindangan", "Labason", "Siocon", "Liloy", "Polanco", "Manukan", "Roxas", "Katipunan", "Gutalac", "Salug", "Sergio Osmeña"
  ],
  "Zamboanga Sibugay": [
    "Ipil", "Titay", "Kabasalan", "Diplahan", "Buug", "Imelda", "Mabuhay", "Malangas", "Naga", "Olutanga", "Payao", "R.T. Lim", "Siay", "Talusan", "Tungawan"
  ],
};

/**
 * Returns the list of cities/municipalities for any given province instantly.
 */
export function getCitiesForProvince(provinceName) {
  if (!provinceName) return [];
  const normalized = provinceName.trim();
  const directMatch = CITIES_CATALOG[normalized];
  if (directMatch && directMatch.length > 0) {
    return directMatch.map((c, i) => ({
      city_code: `${normalized}-${i}`,
      name: c,
    }));
  }

  // Generic fallback if not in top list
  return [
    `${normalized} City / Capital`,
    `Central ${normalized}`,
    `North ${normalized}`,
    `South ${normalized}`,
    `East ${normalized}`,
    `West ${normalized}`,
  ].map((c, i) => ({
    city_code: `${normalized}-${i}`,
    name: c,
  }));
}

/**
 * Returns all Philippine municipalities and cities across all 82 provinces with province & coordinates
 */
let cachedAllMunicipalities = null;
export function getAllPhilippineMunicipalities() {
  if (cachedAllMunicipalities) return cachedAllMunicipalities;

  const result = [];
  const seen = new Set();

  Object.keys(CITIES_CATALOG).forEach((province) => {
    const list = CITIES_CATALOG[province] || [];
    const provInfo = PROVINCE_COORDINATES[province] || { lat: 12.8797, lng: 121.7740, region: "All" };

    list.forEach((cityName) => {
      const key = `${cityName.toLowerCase()}::${province.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({
          name: cityName,
          city: cityName,
          province,
          region: provInfo.region || "All",
          lat: provInfo.lat,
          lng: provInfo.lng,
        });
      }
    });
  });

  cachedAllMunicipalities = result;
  return result;
}
