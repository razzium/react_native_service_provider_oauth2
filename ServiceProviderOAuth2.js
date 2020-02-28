// TODO : get params

/**
 * ////////////////////// Libs // todo -> Readme || auto import || both ?!Tiens moi un peu au jus
 */
const axios = require('axios'); // https://github.com/axios/axios
const qs = require('qs'); // https://github.com/ljharb/qs

/**
 * ////////////////////// OAuth2 data
 */
let IS_OAUTH2 = false;
let IS_OAUTH2_LOGS = false;
let OAUTH2_CLIENT_ID = null;
let OAUTH2_CLIENT_SECRET = null;
let OAUTH2_GET_TOKENS_URL = null;
let OAUTH2_ACCESS_TOKEN = null;
let OAUTH2_REFRESH_TOKEN = null;
let OAUTH2_USER_LOGIN = null;
let OAUTH2_USER_PASSWORD = null;
let OAUTH2_LOGOUT_CALLBACK = null;
let OAUTH2_SAVE_TOKENS_METHOD = null;
let OAUTH2_TMP_ORIG_REQ = null;
let OAUTH2_TMP_IS_CALLING_TOKENS_FROM_CREDENTIALS = false;

/**
 *
 * ////////////////////// ServiceProvider logic methods START (public methods) //////////////////////
 *
 */
// Set interceptor (with OAuth2 by condition -> IS_OAUTH2)
axios.interceptors.response.use(

    async (response) => { return response },
    async (error) => {

        let isOAuth2WorkflowCall = true
        if (error !== undefined && error !== null && error.config !== undefined && error.config !== null && error.config.isOAuth2WorkflowCall !== null && error.config.isOAuth2WorkflowCall !== null && error.config.isOAuth2WorkflowCall) {
            isOAuth2WorkflowCall = error.config.isOAuth2WorkflowCall
        }

        if (IS_OAUTH2 && isOAuth2WorkflowCall) {

            // Get original request
            const originalRequest = error.config ? error.config : null

            // Get status code response
            const status = error.response ? error.response.status : 0

            if (IS_OAUTH2_LOGS) {

                console.log("/////////////////////////////")
                console.log("ServiceProviderOAuth2 lib : status")
                console.log(status)
                console.log("/////////////////////////////")

                console.log("/////////////////////////////")
                console.log("ServiceProviderOAuth2 lib : originalRequest")
                console.log(originalRequest)
                console.log("/////////////////////////////")

            }

            if (status === 401) {

                OAUTH2_ACCESS_TOKEN = null

                // Check if from refreshToken -> then call access_token by refresh_token
                if (OAUTH2_REFRESH_TOKEN !== null) {

                    if (originalRequest !== null) {

                        // Save original request (on first 401 -> to be able to fire it even if request for new tokens with refresh_token fails)
                        OAUTH2_TMP_ORIG_REQ = originalRequest;

                        const accessToken = await getAccessTokenByRefreshToken();

                        if (IS_OAUTH2_LOGS) {

                            console.log("/////////////////////////////")
                            console.log("ServiceProviderOAuth2 lib : getAccessTokenByRefreshToken")
                            console.log(accessToken)
                            console.log("/////////////////////////////")

                        }

                        // Set new accessToken in Bearer
                        if (accessToken != null && OAUTH2_TMP_ORIG_REQ !== null) {
                            OAUTH2_TMP_ORIG_REQ.headers['Authorization'] = 'Bearer ' + accessToken
                            OAUTH2_TMP_ORIG_REQ.isOAuth2WorkflowCall = isOAuth2WorkflowCall
                        }

                        OAUTH2_TMP_ORIG_REQ.isFromRefreshTokenCall = isFromRefreshTokenCall

                        // Re fire original request
                        return axios(OAUTH2_TMP_ORIG_REQ);

                    }
                    else {
                        return Promise.reject(error)
                    }


                }
                // Check if user's credentials are available -> then call access_token by credentials
                else if (OAUTH2_USER_LOGIN !== null && OAUTH2_USER_PASSWORD !== null) {

                    OAUTH2_TMP_IS_CALLING_TOKENS_FROM_CREDENTIALS = true

                    if (OAUTH2_TMP_ORIG_REQ !== null) {

                        const accessToken = await getAccessTokenByCredentials();

                        if (IS_OAUTH2_LOGS) {

                            console.log("/////////////////////////////")
                            console.log("ServiceProviderOAuth2 lib : getAccessTokenByCredentials")
                            console.log(accessToken)
                            console.log("/////////////////////////////")

                        }

                        // Set new accessToken in Bearer
                        if (accessToken != null) {
                            OAUTH2_TMP_ORIG_REQ.headers['Authorization'] = 'Bearer ' + accessToken
                            OAUTH2_TMP_ORIG_REQ.isOAuth2WorkflowCall = isOAuth2WorkflowCall
                        }

                        OAUTH2_TMP_ORIG_REQ.isFromCredentialsCall = isFromCredentialsCall

                        return axios(OAUTH2_TMP_ORIG_REQ);

                    }
                    else {
                        return Promise.reject(error)
                    }

                }
                else {
                    goLogout(error)
                }
            }
            else {

                if (OAUTH2_TMP_IS_CALLING_TOKENS_FROM_CREDENTIALS) { // todo replace by params ?!

                    OAUTH2_TMP_IS_CALLING_TOKENS_FROM_CREDENTIALS = false

                    goLogout(error)


                } else {

                    return Promise.reject(error)

                }

            }

        } else {
            return Promise.reject(error)
        }

    })

/**
 * This method will make a GET request
 * @param url Endpoint's URL
 * @param callbackRequestSuccess Url to call if request is success
 * @param callbackRequestError Url to call if request fails
 * @param callbackRequestError Url to call if request fails
 * @param isOAuth2WorkflowCall Boolean to set if lib have to add access_token in Bearer (false by default)
 */
function getRequest(url, callbackRequestSuccess, callbackRequestError, isOAuth2WorkflowCall = false) {

    if  (url !== undefined && url !== null) {

        // Set headers
        let headers = {};

        // If OAuth2 active and token is needed -> manage Bearer
        if (IS_OAUTH2 && isOAuth2WorkflowCall) {

            if  (OAUTH2_ACCESS_TOKEN !== undefined && OAUTH2_ACCESS_TOKEN !== null) {

                const OAuth2AccessToken = 'Bearer '.concat(OAUTH2_ACCESS_TOKEN);
                headers = { Authorization: OAuth2AccessToken }

            }

        }

        params = {
            headers: headers,
            isOAuth2WorkflowCall: isOAuth2WorkflowCall
        }

        axios.get(url, params)
            .then(response => {

                // If OAuth2 active -> delete original request
                if (IS_OAUTH2) {
                    OAUTH2_TMP_ORIG_REQ = null;
                }

                callbackRequestSuccess(response)

            })
            .catch((error) => {

                if  (callbackRequestError !== undefined && callbackRequestError !== null) {
                    callbackRequestError(error)
                }

            });

    } else {

        if  (callbackRequestError !== undefined && callbackRequestError !== null) {
            callbackRequestError("Invalid URL !")
        }

    }

}

/**
 * This method will make a POST request
 * @param postData POST data to send
 * @param url Endpoint's URL
 * @param callbackRequestSuccess Url to call if request is success
 * @param callbackRequestError Url to call if request fails
 * @param isOAuth2WorkflowCall Boolean to set if lib have to add access_token in Bearer (false by default)
 */
function postRequest(postData, url, callbackRequestSuccess, callbackRequestError, isOAuth2WorkflowCall = false, hasToStringify = true) {

    if  (url !== undefined && url !== null) {

        // Set headers
        let headers = {};

        // If OAuth2 active and token is needed -> manage Bearer
        if (IS_OAUTH2 && isOAuth2WorkflowCall) {

            if  (OAUTH2_ACCESS_TOKEN !== undefined && OAUTH2_ACCESS_TOKEN !== null) {

                const OAuth2AccessToken = 'Bearer '.concat(OAUTH2_ACCESS_TOKEN);
                headers = { Authorization: OAuth2AccessToken }

            }

        }

        let finalPostData = hasToStringify ? qs.stringify(postData) : postData

        params = {
            headers: headers,
            isOAuth2WorkflowCall: isOAuth2WorkflowCall
        }

        axios.post(url, finalPostData, params)
            .then(function (response) {

                // If OAuth2 active -> delete original request
                if (IS_OAUTH2) {
                    OAUTH2_TMP_ORIG_REQ = null;
                }

                callbackRequestSuccess(postData, response)

            })
            .catch(function (error) {

                // If callback is not null -> call it
                if (callbackRequestError !== null) {
                    callbackRequestError(postData, error);
                }

            });

    }

}

/**
 * This method will make a PUT request
 * @param putData PUT data to send
 * @param url Endpoint's URL
 * @param callbackRequestSuccess Url to call if request is success
 * @param callbackRequestError Url to call if request fails
 * @param isOAuth2WorkflowCall Boolean to set if lib have to add access_token in Bearer (false by default)
 */
function putRequest(putData, url, callbackRequestSuccess, callbackRequestError, isOAuth2WorkflowCall = false) {

    if  (url !== undefined && url !== null) {

        // Set headers
        let headers = {};

        // If OAuth2 active and token is needed -> manage Bearer
        if (IS_OAUTH2 && isOAuth2WorkflowCall) {

            if  (OAUTH2_ACCESS_TOKEN !== undefined && OAUTH2_ACCESS_TOKEN !== null) {

                const OAuth2AccessToken = 'Bearer '.concat(OAUTH2_ACCESS_TOKEN);
                headers = { Authorization: OAuth2AccessToken }

            }

        }

        params = {
            headers: headers,
            isOAuth2WorkflowCall: isOAuth2WorkflowCall
        }

        axios.put(url, putData, params)
            .then(function (response) {

                // If OAuth2 active -> delete original request
                if (IS_OAUTH2) {
                    OAUTH2_TMP_ORIG_REQ = null;
                }

                callbackRequestSuccess(putData, response)

            })
            .catch(function (error) {

                console.log(error);
                // If callback is not null -> call it
                if (callbackRequestError !== null) {
                    callbackRequestError(putData, error);
                }

            });

    }

}

/**
 *
 * ////////////////////// ServiceProvider logic methods END (public methods) //////////////////////
 *
 */

/**
 *
 * ////////////////////// OAuth2 config methods START (public methods) //////////////////////
 *
 */

/**
 * Instantiate OAuth2 ServiceProvider
 *
 * @param urlGetTokens Url to call to have tokens (acces_token or resfresh_token)
 * @param clientId OAuth2 client_id
 * @param clientId OAuth2 client_secret
 */
function setOAuth2Data(urlGetTokens, clientId, clientSecret) {
    IS_OAUTH2 = true
    OAUTH2_GET_TOKENS_URL = urlGetTokens
    OAUTH2_CLIENT_ID = clientId
    OAUTH2_CLIENT_SECRET = clientSecret
}

/**
 *
 * Set the callback that will be fired when all transparent auth worfklow fails (accessToken -> refreshToken -> credentials)
 *
 * @param logoutCallback Callback to call when all transprent workflow fails
 */
function setOAuth2LogoutCallback(logoutCallback) {
    OAUTH2_LOGOUT_CALLBACK = logoutCallback
}

/**
 *
 * Set method use in project to save new tokens after transparent auth
 *
 * @param saveTokensMethod Method use in project to save credentials and tokens
 */
function setSaveTokensMethod(saveTokensMethod) {
    OAUTH2_SAVE_TOKENS_METHOD = saveTokensMethod
}

/**
 *
 * Set the OAuth2 access_token
 *
 * @param accessToken  OAuth2 access_token
 */
function setOAuth2AccessToken(accessToken) {

    if (IS_OAUTH2_LOGS) {

        console.log("/////////////////////////////")
        console.log("ServiceProviderOAuth2 lib : setOAuth2AccessToken")
        console.log(accessToken)
        console.log("/////////////////////////////")

    }

    OAUTH2_ACCESS_TOKEN = accessToken
}

/**
 *
 * Set the OAuth2 refresh_token
 *
 * @param refreshToken  OAuth2 refresh_token
 */
function setOAuth2RefreshToken(refreshToken) {

    if (IS_OAUTH2_LOGS) {

        console.log("/////////////////////////////")
        console.log("ServiceProviderOAuth2 lib : setOAuth2RefreshToken")
        console.log(refreshToken)
        console.log("/////////////////////////////")

    }

    OAUTH2_REFRESH_TOKEN = refreshToken
}

/**
 *
 * Set the OAuth2 username
 *
 * @param refreshToken  OAuth2 username
 */
function setOAuth2Username(username) {
    OAUTH2_USER_LOGIN = username
}

/**
 *
 * Set the OAuth2 user password
 *
 * @param userPassword  OAuth2 user password
 */
function setOAuth2UserPassword(userPassword) {
    OAUTH2_USER_PASSWORD = userPassword
}

/**
 *
 * Set OAuth2 logs active (calls, data, etc)
 *
 */
function setLogsActive() {
    IS_OAUTH2_LOGS = true
}

/**
 *
 * Delete all OAuth2 user data (access_token, refresh_token, username, password)
 *
 */
function deleteOAuth2UserData() {

    OAUTH2_ACCESS_TOKEN = null;
    OAUTH2_REFRESH_TOKEN = null;
    OAUTH2_USER_LOGIN = null;
    OAUTH2_USER_PASSWORD = null;

    OAUTH2_LOGOUT_CALLBACK = null;
    OAUTH2_TMP_ORIG_REQ = null;
    OAUTH2_TMP_IS_CALLING_TOKENS_FROM_CREDENTIALS = false;

}

/**
 *
 * ////////////////////// OAuth2 config methods START (public methods) //////////////////////
 *
 */

/**
 *
 * ////////////////////// OAuth2 logic methods START (private methods) //////////////////////
 *
 */

/**
 *
 * Delete all OAuth2 user data then fire callback if defined
 *
 */
function goLogout(error) {

    OAUTH2_TMP_ORIG_REQ = null;

    OAUTH2_ACCESS_TOKEN = null;
    OAUTH2_REFRESH_TOKEN = null;
    OAUTH2_USER_LOGIN = null;
    OAUTH2_USER_PASSWORD = null;

    // If logout callback is defined -> fire it
    if (OAUTH2_LOGOUT_CALLBACK !== null) {
        OAUTH2_LOGOUT_CALLBACK()
    } else {
        return Promise.reject(error)
    }

}

/**
 *
 * Get new access_token by refresh_token
 *
 */
async function getAccessTokenByRefreshToken() {

    let postData = {
        grant_type: 'refresh_token',
        scope: 'USER',
        refresh_token: OAUTH2_REFRESH_TOKEN,
        client_id: OAUTH2_CLIENT_ID,
        client_secret: OAUTH2_CLIENT_SECRET,
    };

    OAUTH2_REFRESH_TOKEN = null;

    return axios.post(OAUTH2_GET_TOKENS_URL, qs.stringify(postData))
        .then(function (response) {

            if (response !== undefined && response !== null && response.data !== undefined && response.data !== null && response.data.access_token !== undefined && response.data.access_token !== null) {

                OAUTH2_ACCESS_TOKEN = response.data.access_token;
                OAUTH2_REFRESH_TOKEN = response.data.refresh_token;

                // If logout save tokens method is defined -> fire it
                if (OAUTH2_SAVE_TOKENS_METHOD !== null) {
                    OAUTH2_SAVE_TOKENS_METHOD(response.data.access_token, response.data.refresh_token);
                }

                return response.data.access_token

            } else {
                return null
            }
        })
        .catch(function (error) {
            return null
        });
}

/**
 *
 * Get new access_token by credentials
 *
 */
async function getAccessTokenByCredentials() {

    const ORIG_OAUTH2_USER_LOGIN = OAUTH2_USER_LOGIN;
    const ORIG_USER_PASSWORD = OAUTH2_USER_PASSWORD;

    let postData = {
        grant_type: 'password',
        scope: 'USER',
        client_id: OAUTH2_CLIENT_ID,
        client_secret: OAUTH2_CLIENT_SECRET,
        username: OAUTH2_USER_LOGIN,
        password: OAUTH2_USER_PASSWORD,
    };

    OAUTH2_USER_LOGIN = null;
    OAUTH2_USER_PASSWORD = null;

    return axios.post(OAUTH2_GET_TOKENS_URL, qs.stringify(postData))
        .then(function (response) {
            if (response !== undefined && response !== null && response.data !== undefined && response.data !== null && response.data.access_token !== undefined && response.data.access_token !== null) {

                OAUTH2_ACCESS_TOKEN = response.data.access_token;
                OAUTH2_REFRESH_TOKEN = response.data.refresh_token;
                OAUTH2_USER_LOGIN = ORIG_OAUTH2_USER_LOGIN;
                OAUTH2_USER_PASSWORD = ORIG_USER_PASSWORD;

                // If logout save tokens method is defined -> fire it
                if (OAUTH2_SAVE_TOKENS_METHOD !== null) {

                    if (IS_OAUTH2_LOGS) {

                        console.log("/////////////////////////////")
                        console.log("ServiceProviderOAuth2 lib : call OAUTH2_SAVE_TOKENS_METHOD")
                        console.log("/////////////////////////////")

                    }

                    OAUTH2_SAVE_TOKENS_METHOD(response.data.access_token, response.data.refresh_token);
                }

                return response.data.access_token

            } else {
                return null
            }
        })
        .catch(function (error) {
            return error
        });
}

/**
 *
 * ////////////////////// OAuth2 logic methods START (private methods) //////////////////////
 *
 */

export default {
    getRequest,
    postRequest,
    putRequest,
    setOAuth2Data,
    setOAuth2AccessToken,
    setOAuth2LogoutCallback,
    setSaveTokensMethod,
    setOAuth2RefreshToken,
    setOAuth2Username,
    setOAuth2UserPassword,
    setLogsActive,
    deleteOAuth2UserData,
}