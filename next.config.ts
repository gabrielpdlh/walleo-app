import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite acessar o dev server de outros aparelhos na MESMA rede (ex.: celular
  // apontando para http://<ip-da-maquina>:3000). O Next 16 bloqueia recursos de
  // dev (HMR/chunks) de origens cruzadas por padrão. Troque/adicione o IP da
  // máquina conforme a rede atual (veja: ifconfig | grep "inet ").
  allowedDevOrigins: ["10.194.118.233"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
