const products = [
  {'name': 'T-Shirt',       'price': 25, 'gender': '男裝', 'category': '上衣', 'image_url': './img/T-Shirt.png'},
  {'name': 'Blouse',        'price': 30, 'gender': '女裝', 'category': '上衣', 'image_url': './img/Blouse.png'},
  {'name': 'Jeans',         'price': 50, 'gender': '通用', 'category': '褲/裙子', 'image_url': './img/Jeans.png'},
  {'name': 'Skirt',         'price': 40, 'gender': '女裝', 'category': '褲/裙子', 'image_url': './img/Skirt.png'},
  {'name': 'Sneakers',      'price': 60, 'gender': '通用', 'category': '鞋子', 'image_url': './img/Sneakers.png'},
  {'name': 'Leather Shoes', 'price': 80, 'gender': '男裝', 'category': '鞋子', 'image_url': './img/LeatherShoes.png'},
  {'name': 'Baseball Cap',  'price': 20, 'gender': '通用', 'category': '帽子', 'image_url': './img/BaseballCap.png'},
  {'name': 'Sun Hat',       'price': 25, 'gender': '女裝', 'category': '帽子', 'image_url': './img/SunHat.png'},
  {'name': 'Running Shoes', 'price': 85, 'gender': '通用', 'category': '鞋子', 'image_url': './img/RunningShoes.png'},
  {'name': 'Dress',         'price': 75, 'gender': '女裝', 'category': '上衣', 'image_url': './img/Dress.png'}
];

function display_products(products_to_display){
  const tbody = document.querySelector('#products table tbody');
  tbody.innerHTML = '';
  for(let i = 0; i < products_to_display.length; i++){
    let product_info = '';
    product_info += '<tr>';
    product_info += `<td><img src='${products_to_display[i].image_url}' alt='${products_to_display[i].name}'></td>`;
    product_info += `<td>${products_to_display[i].name}</td>`;
    product_info += `<td>${products_to_display[i].price}</td>`;
    product_info += `<td>${products_to_display[i].gender}</td>`;
    product_info += `<td>${products_to_display[i].category}</td>`;
    product_info += '</tr>';
    tbody.innerHTML += product_info;
  }
}
function apply_filter(products_to_filter){
  const max_price = document.getElementById('max_price').value;
  const min_price = document.getElementById('min_price').value;
  const gender = document.getElementById('gender').value;
  const category_shirts = document.getElementById('shirts').checked;
  const category_pants = document.getElementById('pants').checked;
  const category_shoes = document.getElementById('shoes').checked;
  const category_cap = document.getElementById('cap').checked;
  let result = [];
  for(let i = 0; i < products_to_filter.length; i++){
    // TODO:[JS-WritingPart Start]-------------------------------------
    let fit_price = true;
    if(min_price&&max_price){
      fit_price=products_to_filter[i].price>=min_price&&products_to_filter[i].price<=max_price;
    }
    else if(max_price){
      fit_price=products_to_filter[i].price<=max_price;
    }
    else if(min_price){
      fit_price=products_to_filter[i].price>=min_price;
    }
    let fit_gender = true;
    if(gender==='男裝'){
      fit_gender=products_to_filter[i].gender==='男裝'||products_to_filter[i].gender==='通用';
    }
    else if(gender==='女裝'){
      fit_gender=products_to_filter[i].gender==='女裝'||products_to_filter[i].gender==='通用';
    }
    else{
      fit_gender=true;
    }
    let fit_category = true;
    if(category_cap||category_pants||category_shirts||category_shoes){
      fit_category=(category_shirts&&products_to_filter[i].category==='上衣')||
                   (category_pants&&products_to_filter[i].category==='褲/裙子')||
                   (category_shoes&&products_to_filter[i].category==='鞋子')||
                   (category_cap&&products_to_filter[i].category==='帽子');
    }

    // TODO:[JS-WritingPart End]---------------------------------------
    if(fit_price && fit_gender && fit_category){
      result.push(products[i]);
    }
  }
  display_products(result);
}

display_products(products);