require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// * Please DO NOT INCLUDE the private app access token in your repo. Don't do this practicum in your normal account.
const PRIVATE_APP_ACCESS = process.env.PRIVATE_APP_ACCESS;
const cars_endpoint = 'https://api.hubapi.com/crm/v3/objects/2-193079179';
const headers = {
    Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
    'Content-Type': 'application/json'
}
// Car "cache"
var cars = []

// Filter cars cache to get the one with the provided id
function get_car(carId) {
    const car = cars.filter((car) => car.id == carId)
    if (car.length > 0){
        return car[0]
    }
    return false
}

app.get('/', async (req, resp) => {
    let error_message = ""
    // Fetch all Cars custom props
    const properties = ['name', 'color', 'manufacturer', 'nombre_de_portes', 'horsepower', 'production_date']
    const params = {
        'properties': properties.join(',')
    }
    try {
        const cars_resp = await axios.get(cars_endpoint, { headers, params })
        const results = cars_resp.data.results
        if (results) {
            cars = results
        } else {
            error_message = cars_resp.message
        }
    }
    catch (error) {
        console.error(error)
        error_message = error
    }
    finally {
        return resp.render('homepage', {cars, error_message})
    }
})

app.get('/update-cars', (req, resp) => {
    const carId = req.query?.carId
    let car = false
    // if we have a carId then we need to load the car detail to prefill the form
    if (carId) {
        car = get_car(carId)
        if (!car){
            // the carId was not found in the cache, so we redirect to the homepage to refresh it
            resp.redirect('/')
        }
    }
    return resp.render('updates', {title: "Update Custom Object Form | Integrating With HubSpot I Practicum", car})
})

app.post('/update-cars', async (req, resp) => {
    
    const params = req.body
    const car = {
        id: params.carId,
        properties: params,
    }
    const properties = ['name', 'color', 'manufacturer', 'nombre_de_portes', 'horsepower', 'production_date']
    const raw_values = {
        ...params,
        production_date: params.production_date ? new Date(params.production_date).getTime() : ''
    }
    // Restructure form data to schema:
    /*
    'properties': {
        'name': 'name',
        'manufacturer': 'manufacture',
        ...
    }
    */
    const values = {
        'properties': Object.fromEntries(
            Object.entries(raw_values).filter(([key]) => properties.includes(key))
        )
    }
    let error_message = ''

    try {
        let cars_resp;
        // if carId then it's an update else it's a create
        if (params.carId) {
            cars_resp = await axios.patch(`${cars_endpoint}/${params.carId}`, values, { headers });
        } else {
            cars_resp = await axios.post(cars_endpoint, values, { headers });
        }

        if (cars_resp.data.id) {
            return resp.redirect('/');
        } else {
            error_message = cars_resp.message
        }
    } catch (error) {
        console.error(error);
        error_message = error.message
    }

    // Error happens we rerender the updates pug with initial form data send
    return resp.render('updates', {
        title: "Update Custom Object Form | Integrating With HubSpot I Practicum",
        car,
        error_message
    });
})

/** 
* * This is sample code to give you a reference for how you should structure your calls. 

* * App.get sample
app.get('/contacts', async (req, res) => {
    const contacts = 'https://api.hubspot.com/crm/v3/objects/contacts';
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    }
    try {
        const resp = await axios.get(contacts, { headers });
        const data = resp.data.results;
        res.render('contacts', { title: 'Contacts | HubSpot APIs', data });      
    } catch (error) {
        console.error(error);
    }
});

* * App.post sample
app.post('/update', async (req, res) => {
    const update = {
        properties: {
            "favorite_book": req.body.newVal
        }
    }

    const email = req.query.email;
    const updateContact = `https://api.hubapi.com/crm/v3/objects/contacts/${email}?idProperty=email`;
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };

    try { 
        await axios.patch(updateContact, update, { headers } );
        res.redirect('back');
    } catch(err) {
        console.error(err);
    }

});
*/


// * Localhost
app.listen(3000, () => console.log('Listening on http://localhost:3000'));