import { useInternetIdentity } from "./useInternetIdentity";
import { useQuery } from "@tanstack/react-query";
import { type backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";

interface ExtendedBackendInterface extends backendInterface {
  initializeAccessControl: () => Promise<void>;
}

interface ExtendedBackendInterfaceWithSecret extends backendInterface {
  _initializeAccessControlWithSecret: (userSecret: string) => Promise<void>;
}

const ACTOR_QUERY_KEY = "actor";

export function useActor() {
  const { identity } = useInternetIdentity();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        return await createActorWithConfig();
      }

      const actorOptions = {
        agentOptions: {
          identity,
        },
      };

      const actor = await createActorWithConfig(actorOptions);

      if (
        "initializeAccessControl" in actor &&
        typeof (actor as ExtendedBackendInterface).initializeAccessControl ===
          "function"
      ) {
        await (actor as ExtendedBackendInterface).initializeAccessControl();
      } else if (
        "_initializeAccessControlWithSecret" in actor &&
        typeof (actor as ExtendedBackendInterfaceWithSecret)
          ._initializeAccessControlWithSecret === "function"
      ) {
        const adminToken = getSecretParameter("caffeineAdminToken") || "";
        await (
          actor as ExtendedBackendInterfaceWithSecret
        )._initializeAccessControlWithSecret(adminToken);
      }

      return actor;
    },
    // Only refetch when identity changes
    staleTime: Infinity,
    // This will cause the actor to be recreated when the identity changes
    enabled: true,
  });

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
