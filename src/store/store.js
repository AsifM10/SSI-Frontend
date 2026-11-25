import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import adminReducer from "./slices/adminSlice";
import issuerReducer from "./slices/issuerSlice";
import holderReducer from "./slices/holderSlice";
import verifierReducer from "./slices/verifierSlice";
import connectionsReducer from "./slices/connectionsSlice";
import notificationsReducer from "./slices/notificationsSlice";
import messagingReducer from "./slices/messagingSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
    issuer: issuerReducer,
    holder: holderReducer,
    verifier: verifierReducer,
    connections: connectionsReducer,
    notifications: notificationsReducer,
    messaging: messagingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
