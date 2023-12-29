import  { useEffect } from "react";
import { useMsal } from "@azure/msal-react";

const AuthLogin = () => {
  const { instance } = useMsal();

  useEffect(() => {
    instance.loginRedirect().catch((e) => {
      console.log(e);
    });
  }, [instance]);

};

export default AuthLogin;
