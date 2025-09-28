import { useEffect } from "react";

import { useAppDispatch, useAppSelector } from "@app/hooks";
import { signedIn } from "@shared/api/auth-slice";

import { AppRouter } from "./providers/router";

export const App = () => {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);

  useEffect(() => {
    if (status === "anonymous") {
      dispatch(
        signedIn({
          email: "exec.beta@asfp.local",
          name: "Тестовый Руководитель",
          roles: ["ui-tester", "exec"]
        })
      );
    }
  }, [dispatch, status]);

  return <AppRouter />;
};
