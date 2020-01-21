# React Native : Service Provider OAuth2 

This library permits to set OAuth2 API config at app entry point (& signin) and apply and user transparent worfklow (access_token by refresh_token -> by credentials).

## Features
* Signin : save credentials (by passed method) then set OAuth2 workflow -> all POST and GET request will pass Bearer with access_token on calling url (if exists, if not -> fire transparent user workflow)
* Transparent user workflow : if API authenticated method fails with 401, automatically calls GET access_token url by refresh_token (if exists)
* * If fail : automatically call GET access_token url by credentials (if exists)
* * * If fail : call callback methods (generally developers set -> add message + redirect Signin screen)
* * * If success : fire orignal request 
* * If success : fire orignal request 

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
[![N|Solid](https://github.com/razzium/react_native_service_provider_oauth2/blob/master/react_native_service_provider_oauth2.png?raw=true)
