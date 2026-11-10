// Kyiv metro stations: positions and every known name (Ukrainian, English, Russian, old names).
// Source: OpenStreetMap contributors (ODbL). Overpass query of Kyiv subway stations, 2026-11-10.
// Used to place clubs that name a metro station but have no usable address.
export const STATIONS = [
  {"name": "Іподром", "names": ["Hippodrome", "Ipodrom", "Іподром", "Ипподром"], "lat": 50.376553, "lon": 30.469045},
  {"name": "Академмістечко", "names": ["Akademmistechko", "Академгородок", "Академмістечко"], "lat": 50.464704, "lon": 30.355083},
  {"name": "Арсенальна", "names": ["Arsenalna", "Арсенальна", "Арсенальная"], "lat": 50.444488, "lon": 30.545433},
  {"name": "Берестейська", "names": ["Beresteiska", "Берестейская", "Берестейська", "Жовтнева"], "lat": 50.459092, "lon": 30.419688},
  {"name": "Бориспільська", "names": ["Boryspilska", "Бориспольская", "Бориспільська"], "lat": 50.403273, "lon": 30.684265},
  {"name": "Васильківська", "names": ["Vasylkivska", "Васильківська"], "lat": 50.393335, "lon": 30.488223},
  {"name": "Видубичі", "names": ["Vydubychi", "Видубичі"], "lat": 50.402093, "lon": 30.560301},
  {"name": "Вирлиця", "names": ["Vyrlytsia", "Вирлиця", "Вырлица"], "lat": 50.402895, "lon": 30.666116},
  {"name": "Виставковий центр", "names": ["Vystavkovyi Tsentr", "Виставковий центр"], "lat": 50.382499, "lon": 30.477584},
  {"name": "Вокзальна", "names": ["Vokzalna", "Вокзальна", "Вокзальная"], "lat": 50.44164, "lon": 30.488251},
  {"name": "Героїв Дніпра", "names": ["Heroiv Dnipra", "Героїв Дніпра"], "lat": 50.52267, "lon": 30.498899},
  {"name": "Голосіївська", "names": ["Holosiivska", "Голосеевская", "Голосіївська"], "lat": 50.397329, "lon": 30.508162},
  {"name": "Гідропарк", "names": ["Hidropark", "Hydropark", "Гидропарк", "Гідропарк"], "lat": 50.445993, "lon": 30.577034},
  {"name": "Дарниця", "names": ["Darnytsia", "Дарница", "Дарниця"], "lat": 50.45594, "lon": 30.612842},
  {"name": "Деміївська", "names": ["Demiivska", "Демиевская", "Деміївська"], "lat": 50.404932, "lon": 30.516914},
  {"name": "Дніпро", "names": ["Dnipro", "Днепр", "Дніпро"], "lat": 50.441041, "lon": 30.558688},
  {"name": "Дорогожичі", "names": ["Dorohozhychi", "Дорогожичи", "Дорогожичі"], "lat": 50.473734, "lon": 30.448777},
  {"name": "Житомирська", "names": ["Zhytomyrska", "Житомирская", "Житомирська"], "lat": 50.456172, "lon": 30.365873},
  {"name": "Звіринецька", "names": ["Druzhby Narodiv", "Zvirynetska", "Дружби народів", "Звіринецька"], "lat": 50.41825, "lon": 30.545028},
  {"name": "Золоті ворота", "names": ["Golden Gate", "Zoloti Vorota", "Золотые ворота", "Золоті ворота"], "lat": 50.448246, "lon": 30.513479},
  {"name": "Кловська", "names": ["Klovska", "Кловская", "Кловська"], "lat": 50.436929, "lon": 30.531921},
  {"name": "Контрактова площа", "names": ["Kontraktova Ploshcha", "Контрактова площа", "Контрактовая площадь"], "lat": 50.465835, "lon": 30.515081},
  {"name": "Либідська", "names": ["Lybidska", "Либідська", "Лыбедская"], "lat": 50.413111, "lon": 30.524828},
  {"name": "Лукʼянівська", "names": ["Lukianivska", "Лукʼянівська", "Лукьяновская"], "lat": 50.462362, "lon": 30.481805},
  {"name": "Львівська брама", "names": ["Lvivska Brama", "Львівська брама"], "lat": 50.454297, "lon": 30.503038},
  {"name": "Лівобережна", "names": ["Livoberezhna", "Левобережная", "Лівобережна"], "lat": 50.451863, "lon": 30.598168},
  {"name": "Лісова", "names": ["Lisova", "Лесная", "Лісова", "Піонерська"], "lat": 50.46476, "lon": 30.64597},
  {"name": "Майдан Незалежності", "names": ["Independence Square", "Maidan Nezalezhnosti", "Майдан Незалежности", "Майдан Незалежності"], "lat": 50.449936, "lon": 30.524441},
  {"name": "Мінська", "names": ["Minska", "Минская", "Мінська"], "lat": 50.512171, "lon": 30.498574},
  {"name": "Нивки", "names": ["Nyvky", "Нивки"], "lat": 50.458596, "lon": 30.404205},
  {"name": "Оболонь", "names": ["Obolon", "Оболонь"], "lat": 50.501533, "lon": 30.498223},
  {"name": "Олімпійська", "names": ["Olimpiiska", "Олимпийская", "Олімпійська"], "lat": 50.432282, "lon": 30.516403},
  {"name": "Осокорки", "names": ["Osokorky", "Осокорки"], "lat": 50.395186, "lon": 30.616249},
  {"name": "Палац «Україна»", "names": ["Palace \"Ukraine\"", "Palats Ukraina", "Дворец «Украина»", "Палац «Україна»"], "lat": 50.420682, "lon": 30.521309},
  {"name": "Палац спорту", "names": ["Palace of Sports", "Palats Sportu", "Дворец спорта", "Палац спорту"], "lat": 50.438289, "lon": 30.520869},
  {"name": "Печерська", "names": ["Pecherska", "Печерская", "Печерська"], "lat": 50.427625, "lon": 30.538926},
  {"name": "Площа Українських Героїв", "names": ["Ploshcha Lva Tolstoho", "Ploshcha Ukrainskykh Heroiv", "Площа Льва Толстого", "Площа Українських Героїв"], "lat": 50.439417, "lon": 30.516642},
  {"name": "Позняки", "names": ["Pozniaky", "Позняки"], "lat": 50.397897, "lon": 30.634662},
  {"name": "Політехнічний інститут", "names": ["Politekhnichnyi Instytut", "Polytechnic Institute", "Политехнический институт", "Політехнічний інститут"], "lat": 50.450793, "lon": 30.466127},
  {"name": "Почайна", "names": ["Petrivka", "Pochaina", "Петрівка", "Почайна"], "lat": 50.486195, "lon": 30.497891},
  {"name": "Поштова площа", "names": ["Poshtova Ploshcha", "Почтовая площадь", "Поштова площа"], "lat": 50.458776, "lon": 30.524894},
  {"name": "Святошин", "names": ["Sviatoshyn", "Святошин"], "lat": 50.457825, "lon": 30.390801},
  {"name": "Сирець", "names": ["Syrets", "Сирець", "Сырец"], "lat": 50.476389, "lon": 30.430831},
  {"name": "Славутич", "names": ["Slavutych", "Славутич"], "lat": 50.3942, "lon": 30.605158},
  {"name": "Тараса Шевченка", "names": ["Tarasa Shevchenka", "Тараса Шевченка", "Тараса Шевченко"], "lat": 50.473541, "lon": 30.504539},
  {"name": "Театральна", "names": ["Teatralna", "Театральна", "Театральная"], "lat": 50.44521, "lon": 30.518045},
  {"name": "Теремки", "names": ["Teremky", "Теремки"], "lat": 50.366905, "lon": 30.453821},
  {"name": "Університет", "names": ["University", "Universytet", "Университет", "Університет"], "lat": 50.444247, "lon": 30.505893},
  {"name": "Харківська", "names": ["Kharkivska", "Харківська", "Харьковская"], "lat": 50.40069, "lon": 30.652306},
  {"name": "Хрещатик", "names": ["Khreschatyk", "Крещатик", "Хрещатик"], "lat": 50.447187, "lon": 30.522946},
  {"name": "Червоний Хутір", "names": ["Chervonyi Khutir", "Красный хутор", "Червоний Хутір"], "lat": 50.409459, "lon": 30.696177},
  {"name": "Чернігівська", "names": ["Chernihivska", "Комсомольська", "Черниговская", "Чернігівська"], "lat": 50.45989, "lon": 30.630312},
  {"name": "Шулявська", "names": ["Shuliavska", "Завод «Більшовик»", "Шулявская", "Шулявська"], "lat": 50.455075, "lon": 30.44537},
];

const norm = (s) => s.toLowerCase()
  .replace(/[ʼ'’`«»"]/g, "").replace(/ё/g, "е")
  .replace(/(^|\s)(м\.|ст\.|станція|станция|метро|metro|station)(?=\s|$)/g, " ")
  .replace(/\s+/g, " ").trim();

const INDEX = new Map();
for (const st of STATIONS) for (const n of st.names) INDEX.set(norm(n), st);

// "Палац спорту / Площа Льва Толстого" -> the first station that matches. Returns a station or null.
export function findStation(text) {
  if (!text) return null;
  for (const part of String(text).split(/\s*(?:\/|,|;|\bабо\b|\bor\b)\s*/)) {
    const st = INDEX.get(norm(part));
    if (st) return st;
  }
  return null;
}
