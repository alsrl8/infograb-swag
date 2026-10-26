export const products = [
 {id:'duck-n8n',name:'n8n 오리 피규어',category:'피규어',icon:'🦆',stock:8},
 {id:'duck-ionos',name:'IONOS 오리 피규어',category:'피규어',icon:'🦆',stock:2},
 {id:'computer',name:'카드 사이즈 컴퓨터',category:'기타',icon:'💻',stock:4},
 {id:'socks',name:'양말',category:'의류',icon:'🧦',stock:3},
 {id:'bag-n8n',name:'n8n 가방',category:'가방',icon:'👜',stock:11},
 {id:'bag-ionos',name:'IONOS 가방',category:'가방',icon:'👜',stock:1},
 {id:'cap-n8n',name:'n8n 모자',category:'모자',icon:'🧢',stock:3},
 {id:'cap-sendit',name:'send it 모자',category:'모자',icon:'🧢',stock:2},
 {id:'cap-space',name:'우주선 로고 모자',category:'모자',icon:'🚀',stock:2},
 {id:'tee-black-l',name:'검정 반팔티 · L',category:'의류',icon:'👕',stock:2},
 {id:'tee-black-m',name:'검정 반팔티 · M',category:'의류',icon:'👕',stock:2},
 {id:'tee-white-l',name:'흰색 반팔티 · L',category:'의류',icon:'👕',stock:1},
 {id:'hoodie-l',name:'후드티 · L',category:'의류',icon:'👕',stock:1},
 {id:'sticker',name:'스티커',category:'기타',icon:'✨',stock:null},
 {id:'choco-box',name:'박스형 초콜릿',category:'초콜릿',icon:'🍫',stock:null},
 {id:'choco-ritter',name:'Ritter 초콜릿',category:'초콜릿',icon:'🍫',stock:null},
];

export const totalStock = products.reduce((total, product) => total + (product.stock ?? 0), 0);
