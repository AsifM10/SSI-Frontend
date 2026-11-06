import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import adminReducer from "./slices/adminSlice";
import issuerReducer from "./slices/issuerSlice";
import holderReducer from "./slices/holderSlice";
import verifierReducer from "./slices/verifierSlice";
import connectionsReducer from "./slices/connectionsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
    issuer: issuerReducer,
    holder: holderReducer,
    verifier: verifierReducer,
    connections: connectionsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
