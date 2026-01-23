import React from "react";
import { useNavigate } from "react-router-dom";
import { useLoginRedirect } from "#features/auth";

const LoginRedirect = () => {
  const navigate = useNavigate();
  useLoginRedirect({ navigate });

  return <div>로그인 처리 중...</div>;
};

export default LoginRedirect;
