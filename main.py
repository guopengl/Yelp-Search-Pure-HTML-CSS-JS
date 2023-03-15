from flask import Flask, request
from pip._vendor import requests

app=Flask(__name__)

@app.route('/')
def index():
   return app.send_static_file('index.html')

@app.route("/searchyelp")
def searchyelp():
   keyword = request.args.get('keyword')
   latitude = request.args.get('latitude',type=float)
   longitude = request.args.get('longitude',type=float)
   category = request.args.get('category')
   radius = round(request.args.get('radius',type=float))

   url='https://api.yelp.com/v3/businesses/search'
   key=''
   headers={
      'Authorization':'Bearer %s' % key
   }
   params={
      'term': keyword,
      'latitude': latitude,
      'longitude': longitude,
      'radius': radius,
      'categories': category
   }
  
   response = requests.get(url=url,headers=headers,params=params)
   return response.json()

@app.route("/detail/<id>")
def detail(id):
   url='https://api.yelp.com/v3/businesses/'+ id
   key=''
   headers={
      'Authorization':'Bearer %s' % key
   }
   
   response=requests.get(url=url,headers=headers)
   return response.json()


if __name__=="__main__":
   app.run(debug=True)
