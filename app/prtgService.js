const axios = require('axios');

const getPRTGStatus = () =>
    axios.get(
        `${process.env.PRTG_SERVER}/api/table.json?content=sensors&username=${process.env.PRTG_USERNAME}&passhash=${process.env.PRTG_PASSWORD_HASH}`
    );

module.exports = {
    getPRTGStatus,
};
