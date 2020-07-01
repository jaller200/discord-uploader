// Create our options
const options = {
    url: API_URL,
    method: "POST",
    headers: {
        "Authorization": authToken,
        "Content-Type": "application/json",
    },
    json: {
        content: `${message}`,
        tts: "false",
    },
    resolveWithFullResponse: true,
}

// Send our data
const time1 = new Date().getTime();
while (true) {
    await request.post(options).catch(requestErrors.StatusCodeError, reason =>  {
        (async () => {

            console.log("Reason Headers: ", reason.response.headers);
            
            // Log our information: 
            if (reason && reason.headers && reason.headers["X-RateLimit-Limit"]) {
                const limit = reason.headers["X-RateLimit-Limit"];
                const remaining = reason.headers["X-RateLimit-Remaining"];
                const reset = reason.headers["X-RateLimit-Reset"];
                const resetAfter = reason.headers["X-RateLimit-ResetAfter"];
                const bucket = reason.headers["X-RateLimit-Bucket"];

                console.log(`RateLimit[L: ${limit}, R: ${remaining}, R: ${reset} (${resetAfter} s), B: ${bucket}`);
            }

            if (reason.statusCode === 429) {

                // We are being rate limited
                let rateLimit = 2000;
                if (reason.error && reason.error.retry_after) {
                    rateLimit = reason.error.retry_after;
                }

                console.log(`We are being rate limited. Trying again in ${rateLimit} ms`);
                await sleep(rateLimit);
            }
        })();
    }).then(response => {
        if (response && response.headers) {

            // Log our information: 
            const limit = response.headers["X-RateLimit-Limit"];
            const remaining = response.headers["X-RateLimit-Remaining"];
            const reset = response.headers["X-RateLimit-Reset"];
            const resetAfter = response.headers["X-RateLimit-ResetAfter"];
            const bucket = response.headers["X-RateLimit-Bucket"];

            console.log(`RateLimit[L: ${limit}, R: ${remaining}, R: ${reset} (${resetAfter} s), B: ${bucket}`);
        }
    });
    break;
}
const time2 = new Date().getTime();

// Don't send messages too fast
const deltaTime = time2 - time1;
if (deltaTime < RATE_LIMIT) {
    await sleep(RATE_LIMIT - deltaTime);
}

resolve({
    success: true,
});