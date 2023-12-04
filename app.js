require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors');
const crypto = require('crypto');
const port = 3001;
const secretKey = process.env.SECRETKEY;
const accessKey = process.env.ACCESSKEY;
const origin = process.env.ORIGIN;


app.use(express.json());
app.use(cors({
    origin: origin 
}));


function generateHmacSignature(data, secretKey) {
    return crypto
        .createHmac('sha256', secretKey)
        .update(data)
        .digest('hex');
}


app.post('/api/leads', async (req, res) => {
    const { remarks, currentPage } = req.body;

    const itemsPerPage = 12;
    const payload = {
        Parameter: {
            LookupName: "mx_Remarks",
            LookupValue: remarks,
            SqlOperator: "="
        },
        "Paging": {
            "PageIndex": currentPage,
            "PageSize": itemsPerPage
        }
    };


    try {
        const response = await axios.post('http://api-in21.leadsquared.com/v2/LeadManagement.svc/Leads.Get', payload, {
            headers: {
                'Content-Type': 'application/json'
            },
            params: {
                accessKey: accessKey,
                secretKey: secretKey
            }
        });
        const responseData = response.data;
        const signature = generateHmacSignature(JSON.stringify(responseData), process.env.SECRET_KEY);
        res.json({ data: responseData, signature: signature });
    } catch (error) {
        res.status(500).send('Error fetching leads');
    }
});

app.post('/api/getLeadByPhone', async (req, res) => {
    const { phoneNumber } = req.body;

    const apiUrl = `http://api-in21.leadsquared.com/v2/LeadManagement.svc/RetrieveLeadByPhoneNumber?accessKey=${accessKey}&secretKey=${secretKey}&phone=${phoneNumber}`;

    try {
        const response = await axios.get(apiUrl);
        res.json(response.data);
    } catch (error) {
        res.status(500).send('Error fetching lead');
    }
});

app.post('/submitForm', async (req, res) => {
    const bodyData = req.body;

    const apiUrl = `http://api-in21.leadsquared.com/v2/LeadManagement.svc/Lead.Create?accessKey=${accessKey}&secretKey=${secretKey}`;

    try {
        const response = await axios.post(apiUrl, bodyData, {
            headers: { 'Content-Type': 'application/json' }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).send('Error submitting form');
    }
});

app.post('/updateLeadStatus', async (req, res) => {
    const { leadId, value } = req.body;
    
    const url = `http://api-in21.leadsquared.com/v2/LeadManagement.svc/Lead.Update?accessKey=${accessKey}&secretKey=${secretKey}&leadId=${leadId}`;

    const data = [
        {
            "Attribute": "mx_Disposition",
            "Value": value
        }
    ];

    try {
        const response = await axios.post(url, data, {
            headers: { 'Content-Type': 'application/json' }
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
