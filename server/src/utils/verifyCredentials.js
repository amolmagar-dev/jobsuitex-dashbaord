// services/verify.js
export async function verifyNaukriCredentials(email, password) {
    try {
        const res = await fetch("https://www.naukri.com/central-login-services/v1/login", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
                "appid": "103",
                "cache-control": "no-cache",
                "clientid": "d3skt0p",
                "content-type": "application/json",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Google Chrome\";v=\"135\", \"Not-A.Brand\";v=\"8\", \"Chromium\";v=\"135\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "systemid": "jobseeker",
                "Referer": "https://www.naukri.com/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            body: JSON.stringify({
                username: email,
                password: password
            })
        });

        const data = await res.json();
        return res?.ok && data?.userStateInfo?.userState === "AUTHENTICATED";
    } catch (error) {
        console.error("Login failed", error);
        return false;
    }
}


export const verify = {
    naukri: verifyNaukriCredentials
};