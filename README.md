# The Blog Engine
A platform to increase the proximity between the bloggers and readers.

## Key Features
- Authers can register to our platform and can add new articles.
- They can further edit or even delete their articles.
- Users who are not registered can contact the blogger directly or can even contact us.
- User can add comments to any article he wishes and those will be visible to eveyone.

## Why to use our application
- Easy interaction betweeen the blogger and any normal user.
- Getting to know new ideas and latest news.
- Getting a better user experience interms security and reliablity.

## Target Users
- Budding Bloggers.
- Professionals.

## Technology used
- Nodejs (for implementation of logic)
- Expressjs (for focusing on our business logic)
- Mongo DB (for database management)

## Installation Guide
1. Install Node Js
2. install following node packages
```
npm install bcryptjs body-parser ejs connect-flash express express-messages express-session express-validator mongoose 
nodemailer passport passport-local multer
```
3. Install Mongo DB
4. Run mongo.exe as administrator
5. Create database using command:
```
use nodekb
```
6. Create following collections:
```
db.createCollection('articles')
db.createCollection('users')

```
7. Now run 
```
node app.js
```
8. Local is up at port 1010
```
http://localhost:1010/
```

## Authors
### Sanket Warambhe (11011822)

### Sarang Samarth (11012090)




