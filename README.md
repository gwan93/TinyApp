# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

This project is now hosted on Heroku https://tinyapp-gw.herokuapp.com/. Please wait 5-10 seconds for the Heroku server to wake up after clicking on the link.

Stretch Functionality Included:
- Method Override for put and delete.
- Analytics features when a shortURL is accessed (total visits, unique visitors).
- Flash pop ups to alert users of successes and errors.

## Final Product

!["Screenshot of index page."](https://github.com/gwan93/tinyapp/blob/master/docs/urls-index.png?raw=true)
!["Screenshot of show URL page."](https://github.com/gwan93/tinyapp/blob/master/docs/url-details-page.png?raw=true)
!["Screenshot of log in page."](https://github.com/gwan93/tinyapp/blob/master/docs/url-login.png?raw=true)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session
- method-override
- connect-flash

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node start` command.