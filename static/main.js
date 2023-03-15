const inputKeyword = document.getElementById('input-keyword');
const inputDistance = document.getElementById('input-distance');
const inputCategory = document.getElementById('input-category');
const inputLocation = document.getElementById('input-location');
const checkbox = document.getElementById('checkbox');
const clearButton = document.getElementById('clear-button');
const resultTable = document.getElementById('result-table');
const detailCard = document.getElementById('detail-card');
let tableBody = 0;
let tableHead = 0;

//original json from yelp api
let businessData = 0; 
let detailData = 0; 

const defaultDistance =10;

//set the bahavior of checkbox
checkbox.addEventListener("click",disableInput);

function disableInput(){
   if(checkbox.checked ===true){
      inputLocation.setAttribute("disabled","disabled");
      inputLocation.value = '';
   }
   else{
      inputLocation.removeAttribute("disabled");
   }
}

//set the bahavior of clear-button
clearButton.addEventListener("click",clear);

function clear(){
   inputKeyword.value = '';
   inputDistance.value = '';
   inputCategory.value = 'All';
   inputLocation.value ='';
   inputLocation.removeAttribute("disabled");
   checkbox.checked = false;
   resultTable.innerHTML = '';
   detailCard.innerHTML = '';
   resultTable.style.visibility = "hidden";
   detailCard.style.visibility = "hidden";
}

//set the bahavior of submission
async function submitForm(e) {
   e.preventDefault();

   resultTable.style.visibility = "visible";
   detailCard.style.visibility = "hidden";
   detailCard.innerHTML = '';
   //gather search info
   let keyword = inputKeyword.value;
   let category = inputCategory.value;
   let latitude = 0;
   let longitude = 0;
   let distance = inputDistance.value; //miles
   //if user did not input distance, use defaultDistance.
   if(distance === ''){
      distance = defaultDistance;
   }
   let radius = distance * 1609.344; //meters
   if(radius !== radius){  //true when radius is a NaN, which is when user's input is not a number
      resultTable.innerHTML = "<p>The entered distance is not a number</p>";
      return;
   }

   //get latitute and longitude from ipinfo when checked
   if(checkbox.checked === true){
      let loc = await getLocFromIp(); // return array = [latitude, longitude]
      latitude = loc[0];
      longitude = loc[1];
   }
   //get latitute and longitude from user input
   else{
      let loc = inputLocation.value; //string like "Los Angeles"
      let location = encodeURI(loc); //turn into "Los%20Angeles"
      loc = await getLocFromInput(location); //return a object{latitude, longitude}. if location is not valid, returns undefined.
      if(loc == undefined){
         resultTable.innerHTML = "<p>The entered location does not exit</p>";
         return;
      }
      latitude = loc.lat;
      longitude = loc.lng;
   }

   //use backend to get info from yelp api
   const response = await fetch(`/searchyelp?keyword=${keyword}&latitude=${latitude}&longitude=${longitude}&category=${category}&radius=${radius}`);
   const data = await response.json(); //data is json
   businessData = data.businesses;  //businessData is an array, save it as global var

   if(businessData.length !=0){
      renderTableHead();
      renderTableBody(businessData); 
      resultTable.scrollIntoView();
   }
   else{
      resultTable.innerHTML = "<p>No record has been found</p>";
   }

}

async function getLocFromIp(){
   const response = await fetch("https://ipinfo.io/?token=");
   const data = await response.json();
   let loc = data.loc;
   loc = loc.split(",");
   return loc;
}

async function getLocFromInput(location){
   const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${location}&key=`);
   const data = await response.json();
   if(data.results.length != 0){
      let loc = data.results[0].geometry.location;
      return loc; 
   }
   else{
      return undefined; 
   }

}

function renderTableHead(){  
   resultTable.innerHTML =`
   <table>
      <thead>
         <tr>
            <th>No.</th>
            <th>Image</th>
            <th data-direction="asc" data-sort="name">Business Name</th>
            <th data-direction="asc" data-sort="rating">Rating</th>
            <th data-direction="asc" data-sort="distance">Distance(miles)</th>
         </tr>
      </thead>
      <tbody></tbody>
   </table>
   `;
   tableHead = document.querySelector('thead');
   tableHead.addEventListener("click", sortTable);
}


function sortTable(e){
   if(e.target.matches('th') && e.target.dataset.sort != undefined){
      let direction = e.target.dataset.direction;
      let sort = e.target.dataset.sort;

      e.target.dataset.direction = (direction === 'asc'? 'desc' :'asc');

      businessData.sort(orderBy(direction,sort));
      renderTableBody(businessData);
   }
}

function orderBy(direction,sort){
   return function compare(a,b){
      let comparison = 0;
      let value = (direction === 'desc' ? 1 : -1);
      switch(sort){
         case 'name':
            if(a.name > b.name){
               comparison = value;
            }
            else{
               comparison = value * -1;
            }
            break;
         case 'rating':
            if(a.rating > b.rating){
               comparison = value;
            }
            else{
               comparison = value * -1;
            }
            break;
         case 'distance':
            if(a.distance > b.distance){
               comparison = value;
            }
            else{
               comparison = value * -1;
            }
            break;
      }
      return comparison;
   }
}

function renderTableBody(businesses){ //businesses is an array containing business info
   tableBody = document.querySelector('tbody');
   let number = 1;  //serial number
   tableBody.innerHTML=`
   ${businesses.map(business =>{
      return `
         <tr>
            <td>${number++}</td>
            <td><img src=${business.image_url}></td>
            <td>
               <a data-id="${business.id}">${business.name}</a>
            </td> 
            <td>${business.rating}</td>
            <td>${(business.distance/1609.344).toFixed(2)}</td>
         </tr>
      `;
   }).join(' ')}
   `;
   tableBody.addEventListener('click', renderDetails);
}


async function renderDetails(e){
   if(e.target.matches('a')){
      detailCard.style.visibility = "visible";
      detailCard.innerHTML = '';

      let id = e.target.dataset.id;
      const response = await fetch(`/detail/${id}`);
      const data = await response.json(); //data is json
      detailData = data;
   
      //get data
      let name = detailData.name;
      let categories = detailData.categories.map(category => {
         return category.title;
      }).join(' | ');
      let address = detailData.location.display_address[0]+' '+ detailData.location.display_address[1];
      let phoneNumber = detailData.display_phone;
      let transactions = detailData.transactions.join(' | ');
      let price = detailData.price;
      let url = detailData.url;
      let photos = detailData.photos;

      //create html: skip those that do not exit
      detailCard.innerHTML+=`
         <div>
           ${name}
         </div>
         <hr>
         `;

      if(detailData.hasOwnProperty("hours")){
         let isOpenNow = detailData.hours[0].is_open_now; 
         detailCard.innerHTML+=`
         <div>
            <label>Status</label>
            <p data-status=${isOpenNow === true? 'Open-Now':'Closed'}>${isOpenNow === true? 'Open Now':'Closed'}</p>
         </div>
         `;
      }

      if(categories!=undefined && categories!=''){
         detailCard.innerHTML+=`
         <div>
            <label>Category</label>
            <p>${categories}</p>
         </div>
         `;
      }
      if(address!=undefined && address!=''){
         detailCard.innerHTML+=`
         <div>
            <label>Address</label>
            <p>${address}</p>
         </div>
         `;
      }
      if(phoneNumber!=undefined && phoneNumber!=''){
         detailCard.innerHTML+=`
         <div>
            <label>Phone Number</label>
            <p>${phoneNumber}</p>
         </div>
         `;
      }
      if(transactions!=undefined && transactions!=''){
         detailCard.innerHTML+=`
         <div>
            <label>Transactions Supported</label>
            <p>${transactions}</p>
         </div>
         `;
      }
      if(price!=undefined && price!=''){
         detailCard.innerHTML+=`
         <div>
            <label>Price</label>
            <p>${price}</p>
         </div>
         `;
      }
      if(url!=undefined && url!=''){
         detailCard.innerHTML+=`
         <div>
            <label>More Info</label>
            <a href="${url}" target="_blank">Yelp</a>
         </div>
         `;
      }


      if(photos!=undefined && photos!=[]){
         detailCard.innerHTML+=`
         <div class="photos"></div>
         `;
         for(let i = 0; i < photos.length && i < 3; i++){
            document.querySelector(".photos").innerHTML+=`
            <div>
               <img src=${photos[i]} width:100px height=200px>
               <p>Photo ${i+1}</p>
            </div>
            `;
         }
        
      }

      detailCard.scrollIntoView();
   } 
}