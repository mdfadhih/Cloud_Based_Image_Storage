const awsconfig = {
    Auth: {
        region: 'ap-southeast-2',
        userPoolId: 'ap-southeast-2_UoM3U0Hks',
        userPoolWebClientId: '369327686764-khfot0ude4q1vp73otom7fagallit2ai.apps.googleusercontent.com',
        identityPoolId: 'ap-southeast-2:96b9c2aa-1d25-45d0-909a-b97630b1d081',
        oauth: {
            domain: 'pixtagfedauth.auth.ap-southeast-2.amazoncognito.com',
            scope: ['openid', 'profile', 'email'],
            redirectSignIn: 'https://main.dyo832csdajev.amplifyapp.com/',
            redirectSignOut: 'https://main.dyo832csdajev.amplifyapp.com/',
            responseType: 'code' // 
        }
    }
};

export default awsconfig;
