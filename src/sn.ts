

import axios, { AxiosRequestConfig } from "axios";

export default async function callSN(code: string, instance: string, cookie: string, username: string, password: string, scope: string = "global") {

    console.log("Calling ServiceNow with username:", username, "and password:", password);
    const config: AxiosRequestConfig = {};

    config.withCredentials = true;

    config.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (cookie) {
        config.headers.Cookie = cookie;
    } else {
        config.headers.Authorization = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
    }

    const formData = {
        "debug_mode": false,
        "target": "server",
        "scope": scope,
        "code": code,
        "user_data": "",
        "user_data_type": "Plain + (String)",
        "breadcrumb": "",
        "no_quotes": false,
        "show_props": true,
        "show_strings": true,
        "html_messages": true, "fix_gslog": true,
        "support_hoisting": false,
    };

    const payload = `data=${encodeURIComponent(JSON.stringify(formData))}`;
    const url = "https://" + instance + ".service-now.com/snd_xplore.do?action=run";

    try {
        const response = await axios.post(url, payload, config);
        return response.data.result;
    } catch (error) {
        console.error("Error calling ServiceNow:", error);
        throw error;
    }
}
