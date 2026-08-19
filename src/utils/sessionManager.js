// export const SESSION_TIME = 30 * 60 * 1000; // 30 min

// export const saveSession = (loginResponse) => {

//     localStorage.setItem(
//         "token",
//         loginResponse.accessToken
//     );

//     localStorage.setItem(
//         "user",
//         JSON.stringify(loginResponse)
//     );

//     localStorage.setItem(
//         "loginTime",
//         Date.now()
//     );
// };

// export const clearSession = () => {

//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     localStorage.removeItem("loginTime");
// };

// export const isSessionExpired = () => {

//     const loginTime = localStorage.getItem("loginTime");

//     if (!loginTime) return true;

//     const diff = Date.now() - Number(loginTime);

//     return diff > SESSION_TIME;
// };







//new code with D 

export const SESSION_TIME = 30 * 60 * 1000; // 30 minutes

export const saveSession = (user, token) => {

    localStorage.setItem(
        "user",
        JSON.stringify(user)
    );

    localStorage.setItem(
        "token",
        token
    );

    localStorage.setItem(
        "loginTime",
        Date.now().toString()
    );

};

export const clearSession = () => {

    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("loginTime");

};

export const isSessionExpired = () => {

    const loginTime = localStorage.getItem("loginTime");

    if (!loginTime) {
        return true;
    }

    const currentTime = Date.now();

    return (currentTime - Number(loginTime)) > SESSION_TIME;

};