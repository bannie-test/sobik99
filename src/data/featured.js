import { t as tr } from '../utils/i18n.js';
// Brands and models shown in the landing carousel; ids are "<brand>/<model folder>".
import { catalogBrands } from './brands.js';

const featured = [
  { id: 'gan', tag: tr('TỪ TRƯỜNG & CÔNG NGHỆ', "MAGNETS & TECHNOLOGY"), bg: '#bdb1f4', stage: '#eee8ff', models: [['gan/gan-17-magdrive', 'GAN17 MagDrive'], ['gan/gan-12-maglev', 'GAN 12 MagLev']] },
  { id: 'moyu', tag: tr('NHIỀU CÁCH ĐỂ BỨT PHÁ', "CUBES FOR EVERY LEVEL"), bg: '#d5eaa0', stage: '#edf2df', models: [['moyu/moyu-wrm-v11', 'MoYu WeiLong WRM V11'], ['moyu/moyu-rs3m-v5', 'MoYu RS3M V5']] },
  { id: 'qiyi', tag: tr('CHỌN NHỊP XOAY CỦA BẠN', "FIND YOUR TURNING STYLE"), bg: '#f7b6d3', stage: '#fae6ef', models: [['qiyi/qiyi-ms', 'QiYi MS']] },
  { id: 'dayan', tag: tr('MỘT CÁ TÍNH RIÊNG', "A DISTINCT TURNING FEEL"), bg: '#ffd28c', stage: '#fff0d8', models: [['dayan/dayan-guhong-pro-plus-maglev', 'DaYan GuHong Pro+ MagLev'], ['dayan/dayan-tengyun-v2', 'DaYan TengYun V2']] },
  { id: 'yj', tag: tr('KHÁM PHÁ NHIỀU TẦNG HƠN', "EXPLORE MORE LAYERS"), bg: '#a8dedc', stage: '#e2f2ed', models: [['yj/yj-yulong-v2m', 'YJ YuLong V2 M'], ['yj/yj-guanlong-v4-3x3', 'YJ GuanLong V4 3×3']] },
  { id: 'x-man-design', tag: tr('CHỌN NHỊP XOAY CỦA BẠN', "FIND YOUR TURNING STYLE"), bg: '#f7b6d3', stage: '#fae6ef', models: [['x-man-design/xman-tornado-v4-flagship', 'X-Man Tornado V4 Flagship']] },
];

export const featuredBrands = [
  ...featured.map(entry => ({ ...catalogBrands.find(brand => brand.id === entry.id), ...entry })),
  ...catalogBrands.filter(brand => !featured.some(entry => entry.id === brand.id))
    .map(brand => ({ ...brand, bg: '#ded5f3', stage: '#f2ecfa', models: [] })),
];
