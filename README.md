# React Native : Service Provider OAuth2 

This library permits to set OAuth2 API config at app entry point (& signin) and apply and user transparent worfklow (access_token by refresh_token -> credentials).

## Installation
```sh
$ yarn add 'react_native_service_provider_oauth2'
```

## Usage
#### Instantiate OAuth2 configuration
ServiceProvider.setOAuth2Data(GET_ACCESS_TOKEN_URL, CLIENT_ID, CLIENT_SECRET)

#### Set OAuth2 logout callback : method call if all trannsparent workflow fail
ServiceProvider.setOAuth2LogoutCallback(CALLBACK_METHOD)

#### Set OAuth2 save tokens method : method to save tokens on local device (persistant data) when GET_ACCESS_TOKEN_URL() call returns success
ServiceProvider.setSaveTokensMethod(SAVE_LOCAL_TOKENS_METHOD)

## User transparent auth workflow specifics
##### Check detailed comments in "ServiceProviderOAuth2.js"
###### Transparent User Worfklow to apply app side
[![N|Solid](https://cldup.com/dTxpPi9lDf.thumb.png)](https://nodesource.com/products/nsolid)
