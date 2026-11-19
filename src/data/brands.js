// Brand registry: ids match the folders in public/catalog/brands/.
// `logo` is an image path under public/ (e.g. "catalog/logos/gan.webp") or an https:// URL.
// Left empty, the brand shows a grey placeholder with its name.
export const brandNotes = [
 "QiYi official site states four current sub-brands: QY Cube, QY Toys, MoFangGe and X-Man Design.",
 "QiYi history states The Valk was created in partnership with Mats Valk in 2016; it is retained as a related brand rather than one of the four current sub-brands.",
 "YJ official materials describe MGC as a flagship product series/brand of YongJun; the registry therefore models MGC as a child brand/product-brand node.",
 "GAN official site lists Monster Go and Swift Block as sub-brands.",
 "For brands where a formal parent relationship was not verified, parent_id is null even if retailers commonly group them."
];
export const brandSources = [
 {
  "name": "QiYi official",
  "url": "https://www.qiyitoys.net/en/",
  "supports": [
   "qiyi",
   "qy-cube",
   "qy-toys",
   "mofangge",
   "x-man-design",
   "the-valk"
  ]
 },
 {
  "name": "GAN official",
  "url": "https://www.gancube.com/pages/about-us",
  "supports": [
   "gan",
   "monster-go",
   "swift-block"
  ]
 },
 {
  "name": "YJ official",
  "url": "https://www.youngjoecube.com/",
  "supports": [
   "yj",
   "mgc"
  ]
 },
 {
  "name": "The Cubicle popular brands",
  "url": "https://www.thecubicle.com/pages/collections/top-brands",
  "supports": [
   "brand discovery"
  ]
 },
 {
  "name": "Atoutcubes manufacturers",
  "url": "https://www.atoutcubes.com/en/manufacturers",
  "supports": [
   "brand discovery"
  ]
 },
 {
  "name": "MoYu WeiLong WRM V11 (speedcube.nl)",
  "url": "https://www.speedcube.nl/en/speedcube-en/3x3-en/moyu-weilong-wrm-v11-3x3/"
 },
 {
  "name": "MoYu WeiLong V11 (SpeedCubeShop)",
  "url": "https://speedcubeshop.com/products/moyu-weilong-3x3-v11-magnetic-maglev-20-magnet-ball-core-uv-coated"
 },
 {
  "name": "PBCube WR 3x3 (TheCubicle)",
  "url": "https://www.thecubicle.com/collections/new-arrivals/products/pbcube-wr-3x3-20-magnet-ball-core-maglev-uv?f=carousel"
 },
 {
  "name": "GAN official — Speed Cube collection",
  "url": "https://www.gancube.com/collections/gan-speed-cube"
 },
 {
  "name": "GAN15 Maglev (GAN official)",
  "url": "https://www.gancube.com/products/gan15-maglev-3x3-advanced-speed-cube"
 },
 {
  "name": "X-Man Tornado V4 Pioneer (SpeedCubeShop)",
  "url": "https://speedcubeshop.com/products/x-man-tornado-3x3-v4-pioneer-magnetic-maglev-core-magnets-uv-coated"
 },
 {
  "name": "QiYi — Speedsolving wiki",
  "url": "https://www.speedsolving.com/wiki/index.php?title=QiYi"
 },
 {
  "name": "Super RS3M V2 review (TheCubicle)",
  "url": "https://www.thecubicle.com/blogs/thecubicle-blogs/super-rs3m-v2"
 },
 {
  "name": "MoYu RS3M V5 (SpeedCubeShop)",
  "url": "https://speedcubeshop.com/products/moyu-rs3-m-3x3-v5-magnetic-dual-adjustment"
 },
 {
  "name": "YJ MGC Evo II (TheCubicle)",
  "url": "https://www.thecubicle.com/products/yj-mgc-evo-ii-3x3"
 },
 {
  "name": "What 2x2 should you buy in 2025 (speedcubing.org)",
  "url": "https://speedcubing.org/blogs/news/what-2x2-should-you-buy-in-2025"
 },
 {
  "name": "Puzzle Recommendations thread (Speedsolving)",
  "url": "https://speedsolving.com/threads/which-cube-should-i-get-up-to-date-recommendations.70960"
 }
];
export const brandAliases = {
 "qiyi mofangge": "mofangge",
 "qiyi x-man design": "x-man-design",
 "qiyi xman": "x-man-design",
 "x-man": "x-man-design",
 "xman design": "x-man-design",
 "the valk": "the-valk",
 "valk": "the-valk",
 "yongjun": "yj",
 "yongjun toys": "yj",
 "yj mgc": "mgc",
 "yongjun mgc": "mgc",
 "mgc series": "mgc",
 "moyu cubing classroom": "cubing-classroom",
 "cubingclassroom": "cubing-classroom",
 "moyu guoguan": "guoguan",
 "guo guan": "guoguan",
 "mofang jiaoshi": "mofangge",
 "yuxin toys": "yuxin",
 "dian sheng": "diansheng",
 "dian sheng toys": "diansheng",
 "cycloneboys": "cyclone-boys",
 "cyclone boys cube": "cyclone-boys",
 "very puzzle": "verypuzzle",
 "fanxin toys": "fanxin",
 "lanlan toys": "lanlan",
 "rubik": "rubiks",
 "rubik's cube": "rubiks",
 "kungfu": "kfcube",
 "kung fu cube": "kfcube",
 "z cube": "z-cube",
 "cube 4 you": "cube4you",
 "xman": "x-man-design",
 "pb": "pbcube",
 "huameng": "huameng",
 "moyu huameng": "huameng",
 "mfjs": "cubing-classroom",
 "valk": "the-valk"
};
export const brands = [
 {
  "id": "rubiks",
  "name": "Rubik's",
  "parent": null,
  "country": "Hungary (thương hiệu gốc)",
  "summary": "Thương hiệu gốc của khối Rubik do Ernő Rubik phát minh năm 1974.",
  "color": "#C62828",
  "logo": ""
 },
 {
  "id": "gan",
  "name": "GAN",
  "parent": null,
  "country": "Trung Quốc",
  "summary": "Hãng cao cấp: dòng Maglev, cube thông minh Bluetooth; sở hữu các thương hiệu con Monster Go và Swift Block.",
  "color": "#1565C0",
  "logo": ""
 },
 {
  "id": "moyu",
  "name": "MoYu",
  "parent": null,
  "country": "Trung Quốc",
  "summary": "Hãng lớn: dòng WeiLong thi đấu và RS giá rẻ; có các thương hiệu con như PBCube, Cubing Classroom.",
  "color": "#1E88E5",
  "logo": ""
 },
 {
  "id": "pbcube",
  "name": "PBCube",
  "parent": "moyu",
  "country": "Trung Quốc",
  "summary": "Thương hiệu con chuyên biệt của MoYu, dòng flagship WR do nhà vô địch thế giới Yiheng Wang tham gia phát triển.",
  "color": "#263238",
  "logo": ""
 },
 {
  "id": "cubing-classroom",
  "name": "Cubing Classroom",
  "parent": "moyu",
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "guoguan",
  "name": "GuoGuan",
  "parent": "moyu",
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "qiyi",
  "name": "QiYi",
  "parent": null,
  "country": "Trung Quốc",
  "summary": "Hãng lớn với 4 thương hiệu con: QY Cube, QY Toys, MoFangGe và X-Man Design.",
  "color": "#F57C00",
  "logo": ""
 },
 {
  "id": "qy-cube",
  "name": "QY Cube",
  "parent": "qiyi",
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "qy-toys",
  "name": "QY Toys",
  "parent": "qiyi",
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "mofangge",
  "name": "MoFangGe",
  "parent": "qiyi",
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "x-man-design",
  "name": "X-Man Design",
  "parent": "qiyi",
  "country": "Trung Quốc",
  "summary": "Thương hiệu thi đấu của QiYi, nổi tiếng với dòng Tornado.",
  "color": "#212121",
  "logo": ""
 },
 {
  "id": "the-valk",
  "name": "The Valk",
  "parent": "qiyi",
  "country": "Trung Quốc",
  "summary": "Dòng cube QiYi hợp tác với Mats Valk từ 2016.",
  "color": "#0D47A1",
  "logo": ""
 },
 {
  "id": "yj",
  "name": "YJ",
  "parent": null,
  "country": "Trung Quốc",
  "summary": "YongJun: cube giá phải chăng; MGC là dòng sản phẩm chủ lực.",
  "color": "#2E7D32",
  "logo": ""
 },
 {
  "id": "mgc",
  "name": "MGC",
  "parent": "yj",
  "country": "Trung Quốc",
  "summary": "Dòng/thương hiệu sản phẩm chủ lực của YJ.",
  "color": "#388E3C",
  "logo": ""
 },
 {
  "id": "yuxin",
  "name": "YuXin",
  "parent": null,
  "country": "Trung Quốc",
  "summary": "Nhiều puzzle WCA giá tốt, nổi bật với Pyraminx Little Magic.",
  "color": "#00897B",
  "logo": ""
 },
 {
  "id": "shengshou",
  "name": "ShengShou",
  "parent": null,
  "country": "Trung Quốc",
  "summary": "Mạnh về cube kích thước lớn và puzzle lạ, giá dễ tiếp cận.",
  "color": "#00838F",
  "logo": ""
 },
 {
  "id": "sengso",
  "name": "SengSo",
  "parent": "shengshou",
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "dayan",
  "name": "DaYan",
  "parent": null,
  "country": "Trung Quốc",
  "summary": "Hãng speedcube lâu đời, các thiết kế ZhanChi, TengYun có ảnh hưởng lớn.",
  "color": "#6A1B9A",
  "logo": ""
 },
 {
  "id": "diansheng",
  "name": "DianSheng",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "mscube",
  "name": "MsCube",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "fanxin",
  "name": "FanXin",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "cyclone-boys",
  "name": "Cyclone Boys",
  "parent": null,
  "country": "Trung Quốc",
  "summary": "Cube giá rẻ, nhiều mẫu cho người mới.",
  "color": "#5E35B1",
  "logo": ""
 },
 {
  "id": "lanlan",
  "name": "LanLan",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "mf8",
  "name": "MF8",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "verypuzzle",
  "name": "VeryPuzzle",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "fangshi",
  "name": "FangShi",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "mugua",
  "name": "MuGua",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "qj",
  "name": "QJ",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "vin-cube",
  "name": "Vin Cube",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "witeden",
  "name": "WitEden",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "limcube",
  "name": "LimCube",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "cube4you",
  "name": "Cube4You",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "lingao",
  "name": "LingAo",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "huameng",
  "name": "HuaMeng",
  "parent": null,
  "country": "Trung Quốc",
  "summary": "Thường bán dưới tên MoYu HuaMeng; dòng YS3M nam châm.",
  "color": "#D32F2F",
  "logo": ""
 },
 {
  "id": "haitun",
  "name": "HaiTun",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "kfcube",
  "name": "KungFu Cube",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "lefun",
  "name": "Lefun",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "moretry",
  "name": "MoreTry",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "ze-puzzles",
  "name": "ZePuzzles",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "z-cube",
  "name": "Z-Cube",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "cube-twist",
  "name": "Cube Twist",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "maru",
  "name": "Maru",
  "parent": null,
  "country": "",
  "summary": "",
  "color": "#37474F",
  "logo": ""
 },
 {
  "id": "monster-go",
  "name": "Monster Go",
  "parent": "gan",
  "country": "Trung Quốc",
  "summary": "Thương hiệu con của GAN hướng tới người mới và giáo dục.",
  "color": "#43A047",
  "logo": ""
 },
 {
  "id": "swift-block",
  "name": "Swift Block",
  "parent": "gan",
  "country": "Trung Quốc",
  "summary": "Thương hiệu con của GAN với các mẫu giá mềm.",
  "color": "#E65100",
  "logo": ""
 }
];
