/*
 * Copyright 2024 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Entity } from '@backstage/catalog-model';
import {
  createApiRef,
  DiscoveryApi,
  IdentityApi,
} from '@backstage/core-plugin-api';
import { AxiosError } from 'axios';
import { Record } from 'victory-core/lib/victory-util/immutable-types';
import { KIALI_PROVIDER } from '../components/Router';
import { config } from '../config';
import { App, AppQuery } from '../types/App';
import { AppList, AppListQuery } from '../types/AppList';
import { AuthInfo } from '../types/Auth';
import { CertsInfo } from '../types/CertsInfo';
import { DurationInSeconds, HTTP_VERBS, TimeInSeconds } from '../types/Common';
import { DashboardModel } from '../types/Dashboards';
import { GrafanaInfo } from '../types/GrafanaInfo';
import { GraphDefinition, GraphElementsQuery } from '../types/Graph';
import {
  AppHealth,
  NamespaceAppHealth,
  NamespaceHealthQuery,
  NamespaceServiceHealth,
  NamespaceWorkloadHealth,
  ServiceHealth,
  WorkloadHealth,
} from '../types/Health';
import {
  IstioConfigDetails,
  IstioConfigDetailsQuery,
} from '../types/IstioConfigDetails';
import {
  IstioConfigList,
  IstioConfigListQuery,
  IstioConfigsMapQuery,
} from '../types/IstioConfigList';
import {
  CanaryUpgradeStatus,
  LogLevelQuery,
  OutboundTrafficPolicy,
  PodLogs,
  PodLogsQuery,
  ValidationStatus,
} from '../types/IstioObjects';
import {
  ComponentStatus,
  IstiodResourceThresholds,
} from '../types/IstioStatus';
import { IstioMetricsMap } from '../types/Metrics';
import { IstioMetricsOptions } from '../types/MetricsOptions';
import { Namespace } from '../types/Namespace';
import { KialiCrippledFeatures, ServerConfig } from '../types/ServerConfig';
import { ServiceDetailsInfo, ServiceDetailsQuery } from '../types/ServiceInfo';
import { ServiceList, ServiceListQuery } from '../types/ServiceList';
import { StatusState } from '../types/StatusState';
import { TLSStatus } from '../types/TLSStatus';
import { Span, TracingQuery } from '../types/Tracing';
import {
  ClusterWorkloadsResponse,
  Workload,
  WorkloadListQuery,
  WorkloadQuery,
} from '../types/Workload';
import { filterNsByAnnotation } from '../utils/entityFilter';

export const ANONYMOUS_USER = 'anonymous';

export interface Response<T> {
  data: T;
}

interface Namespaces {
  namespaces: string;
}

interface ClusterParam {
  clusterName?: string;
}
export type QueryParams<T> = T & ClusterParam;

/** API URLs */

const urls = config.api.urls;

/**  Headers Definitions */

const loginHeaders = config.login.headers;

/**  Helpers to Requests */

const getHeaders = (proxyUrl?: string): { [key: string]: string } => {
  if (proxyUrl) {
    return { 'Content-Type': 'application/x-www-form-urlencoded' };
  }
  return { ...loginHeaders };
};

/** Create content type correctly for a given request type */
const getHeadersWithMethod = (
  method: HTTP_VERBS,
  proxyUrl?: string,
): { [key: string]: string } => {
  const allHeaders = getHeaders(proxyUrl);
  if (method === HTTP_VERBS.PATCH) {
    allHeaders['Content-Type'] = 'application/json';
  }
  return allHeaders;
};

/* Backstage Requirement*/

export interface KialiApi {
  isDevEnv(): boolean;
  getAuthInfo(): Promise<AuthInfo>;
  getStatus(): Promise<StatusState>;
  getNamespaces(): Promise<Namespace[]>;
  getClustersAppHealth(
    namespaces: string,
    duration: DurationInSeconds,
    cluster?: string,
    queryTime?: TimeInSeconds,
  ): Promise<Map<string, NamespaceAppHealth>>;
  getClustersServiceHealth(
    namespaces: string,
    duration: DurationInSeconds,
    cluster?: string,
    queryTime?: TimeInSeconds,
  ): Promise<Map<string, NamespaceServiceHealth>>;
  getClustersWorkloadHealth(
    namespaces: string,
    duration: DurationInSeconds,
    cluster?: string,
    queryTime?: TimeInSeconds,
  ): Promise<Map<string, NamespaceWorkloadHealth>>;
  getServerConfig(): Promise<ServerConfig>;
  getWorkload(
    namespace: string,
    name: string,
    params: WorkloadQuery,
    cluster?: string,
  ): Promise<Workload>;
  getClustersApps(
    namespaces: string,
    params: AppListQuery,
    cluster?: string,
  ): Promise<AppList>;
  getMeshTls(cluster?: string): Promise<TLSStatus>;
  getNamespaceTls(namespace: string, cluster?: string): Promise<TLSStatus>;
  getOutboundTrafficPolicyMode(): Promise<OutboundTrafficPolicy>;
  getCanaryUpgradeStatus(): Promise<CanaryUpgradeStatus>;
  getIstiodResourceThresholds(): Promise<IstiodResourceThresholds>;
  getConfigValidations(cluster?: string): Promise<ValidationStatus>;
  getAllIstioConfigs(
    objects: string[],
    validate: boolean,
    labelSelector: string,
    workloadSelector: string,
    cluster?: string,
  ): Promise<IstioConfigList>;
  getNamespaceMetrics(
    namespace: string,
    params: IstioMetricsOptions,
  ): Promise<Readonly<IstioMetricsMap>>;
  getIstioStatus(cluster?: string): Promise<ComponentStatus[]>;
  getIstioCertsInfo(): Promise<CertsInfo[]>;
  getClustersWorkloads(
    namespaces: string,
    params: AppListQuery,
    cluster?: string,
  ): Promise<ClusterWorkloadsResponse>;
  getClustersServices(
    namespaces: string,
    params: ServiceListQuery,
    cluster?: string,
  ): Promise<ServiceList>;
  getIstioConfig(
    namespace: string,
    objects: string[],
    validate: boolean,
    labelSelector: string,
    workloadSelector: string,
    cluster?: string,
  ): Promise<IstioConfigList>;
  getIstioConfigDetail(
    namespace: string,
    objectType: string,
    object: string,
    validate: boolean,
    cluster?: string,
  ): Promise<IstioConfigDetails>;
  setEntity(entity?: Entity): void;
  setAnnotation(key: string, value: string): void;
  status(): Promise<any>;
  getPodLogs(
    namespace: string,
    name: string,
    container?: string,
    maxLines?: number,
    sinceTime?: number,
    duration?: DurationInSeconds,
    isProxy?: boolean,
    cluster?: string,
  ): Promise<PodLogs>;
  getWorkloadSpans(
    namespace: string,
    workload: string,
    params: TracingQuery,
    cluster?: string,
  ): Promise<Span[]>;
  setPodEnvoyProxyLogLevel(
    namespace: string,
    name: string,
    level: string,
    cluster?: string,
  ): Promise<void>;
  getServiceDetail(
    namespace: string,
    service: string,
    validate: boolean,
    cluster?: string,
    rateInterval?: DurationInSeconds,
  ): Promise<ServiceDetailsInfo>;
  getApp(
    namespace: string,
    app: string,
    params: AppQuery,
    cluster?: string,
  ): Promise<App>;
  getWorkloadDashboard(
    namespace: string,
    workload: string,
    params: IstioMetricsOptions,
    cluster?: string,
  ): Promise<DashboardModel>;
  getAppDashboard(
    namespace: string,
    app: string,
    params: IstioMetricsOptions,
    cluster?: string,
  ): Promise<DashboardModel>;
  getServiceDashboard(
    namespace: string,
    service: string,
    params: IstioMetricsOptions,
    cluster?: string,
  ): Promise<DashboardModel>;
  getGrafanaInfo(): Promise<GrafanaInfo>;
  getAppSpans(
    namespace: string,
    app: string,
    params: TracingQuery,
    cluster?: string,
  ): Promise<Span[]>;
  getServiceSpans(
    namespace: string,
    service: string,
    params: TracingQuery,
    cluster?: string,
  ): Promise<Span[]>;
  getCrippledFeatures(): Promise<KialiCrippledFeatures>;
  getGraphElements(params: GraphElementsQuery): Promise<GraphDefinition>;
}

export const kialiApiRef = createApiRef<KialiApi>({
  id: 'plugin.kiali.service',
});

export interface ErrorAuth {
  title: string;
  message: string;
  helper: string;
}

export interface Response<T> {
  data: T;
}

export type Options = {
  discoveryApi: DiscoveryApi;
  identityApi: IdentityApi;
};
/* End */

export class KialiApiClient implements KialiApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly identityApi: IdentityApi;
  private kialiUrl?: string;
  private annotations: Record<string, string>;

  constructor(options: Options) {
    this.kialiUrl = '';
    this.discoveryApi = options.discoveryApi;
    this.identityApi = options.identityApi;
    this.annotations = {};
  }

  private newRequest = async <T>(
    method: HTTP_VERBS,
    url: string,
    queryParams?: any,
    data?: any,
    proxy: boolean = true,
    customParams: boolean = false,
  ) => {
    if (this.kialiUrl === '') {
      this.kialiUrl = `${await this.discoveryApi.getBaseUrl('kiali')}`;
    }
    const kialiHeaders = getHeadersWithMethod(method);
    let params: string;
    // This is because, the arrays are stringified as param=value1,value2
    // but kiali needs param[]=value, param[]=value2
    if (customParams) {
      params = this.getCustomParams(queryParams);
    } else {
      params = new URLSearchParams(queryParams).toString();
    }
    const endpoint = queryParams ? `${url}${queryParams && `?${params}`}` : url;
    const { token: idToken } = await this.identityApi.getCredentials();
    const dataRequest = data ? data : {};
    dataRequest.endpoint = endpoint;
    dataRequest.method = method;
    dataRequest.provider = this.annotations?.[KIALI_PROVIDER];

    const jsonResponse = await fetch(
      `${this.kialiUrl}/${proxy ? 'proxy' : 'status'}`,
      {
        method: HTTP_VERBS.POST,
        headers: {
          'Content-Type': 'application/json',
          ...(idToken && { Authorization: `Bearer ${idToken}` }),
          ...kialiHeaders,
        },
        body: JSON.stringify(dataRequest),
      },
    );

    return jsonResponse.json() as T;
  };

  getCustomParams = (queryParams: any): string => {
    let params = '';
    for (const key in queryParams) {
      if (Array.isArray(queryParams[key])) {
        for (let i = 0; i < queryParams[key].length; i++) {
          params += `${key}[]=${queryParams[key]}&`;
        }
      } else {
        params += `${key}=${queryParams[key]}&`;
      }
    }
    return params.slice(0, -1);
  };

  isDevEnv = () => {
    return false;
  };

  status = async (): Promise<any> => {
    return this.newRequest<any>(
      HTTP_VERBS.GET,
      urls.status,
      {},
      {},
      false,
    ).then(resp => resp);
  };

  getAuthInfo = async (): Promise<AuthInfo> => {
    return this.newRequest<AuthInfo>(
      HTTP_VERBS.GET,
      urls.authInfo,
      {},
      {},
    ).then(resp => resp);
  };

  getStatus = async (): Promise<StatusState> => {
    return this.newRequest<StatusState>(
      HTTP_VERBS.GET,
      urls.status,
      {},
      {},
    ).then(resp => resp);
  };

  getNamespaces = async (): Promise<Namespace[]> => {
    return this.newRequest<Namespace[]>(
      HTTP_VERBS.GET,
      urls.namespaces,
      {},
      {},
    ).then(resp => filterNsByAnnotation(resp, this.annotations));
  };

  getServerConfig = async (): Promise<ServerConfig> => {
    return this.newRequest<ServerConfig>(
      HTTP_VERBS.GET,
      urls.serverConfig,
      {},
      {},
    ).then(resp => resp);
  };

  /* HEALTH */

  getClustersAppHealth = async (
    namespaces: string,
    duration: DurationInSeconds,
    cluster?: string,
    queryTime?: TimeInSeconds,
  ): Promise<Map<string, NamespaceAppHealth>> => {
    const params: QueryParams<NamespaceHealthQuery & Namespaces> = {
      type: 'app',
      namespaces: namespaces,
    };
    if (duration) {
      params.rateInterval = `${String(duration)}s`;
    }
    if (queryTime) {
      params.queryTime = String(queryTime);
    }
    if (cluster) {
      params.clusterName = cluster;
    }
    return this.newRequest<Map<string, NamespaceAppHealth>>(
      HTTP_VERBS.GET,
      urls.clustersHealth(),
      params,
      {},
    ).then(response => {
      const ret = new Map<string, NamespaceAppHealth>();
      // @ts-ignore
      const namespaceAppHealth = response.namespaceAppHealth;
      if (namespaceAppHealth) {
        Object.keys(namespaceAppHealth).forEach(ns => {
          ret.set(ns, {});
          if (!ret.get(ns)) {
            ret.set(ns, {});
          }
          Object.keys(namespaceAppHealth[ns]).forEach(k => {
            // @ts-ignore
            if (namespaceAppHealth[ns][k]) {
              // @ts-ignore
              const conv = namespaceAppHealth[ns][k];
              // @ts-ignore
              const ah = AppHealth.fromJson(namespaces, k, conv, {
                rateInterval: duration,
                hasSidecar: true,
                hasAmbient: false,
              });
              const nsAppHealth = ret.get(ns) || {};
              nsAppHealth[k] = ah;
              ret.set(ns, nsAppHealth);
            }
          });
        });
      }
      return ret;
    });
  };

  getClustersServiceHealth = async (
    namespaces: string,
    duration: DurationInSeconds,
    cluster?: string,
    queryTime?: TimeInSeconds,
  ): Promise<Map<string, NamespaceServiceHealth>> => {
    const params: QueryParams<NamespaceHealthQuery & Namespaces> = {
      type: 'service',
      namespaces: namespaces,
    };
    if (duration) {
      params.rateInterval = `${String(duration)}s`;
    }
    if (queryTime) {
      params.queryTime = String(queryTime);
    }
    if (cluster) {
      params.clusterName = cluster;
    }
    return this.newRequest<Map<string, NamespaceServiceHealth>>(
      HTTP_VERBS.GET,
      urls.clustersHealth(),
      params,
      {},
    ).then(response => {
      const ret = new Map<string, NamespaceServiceHealth>();
      // @ts-ignore
      const namespaceServiceHealth = response.namespaceServiceHealth;
      if (namespaceServiceHealth) {
        Object.keys(namespaceServiceHealth).forEach(ns => {
          if (!ret.get(ns)) {
            ret.set(ns, {});
          }
          Object.keys(namespaceServiceHealth[ns]).forEach(k => {
            // @ts-ignore
            if (namespaceServiceHealth[ns][k]) {
              // @ts-ignore
              const conv = namespaceServiceHealth[ns][k];
              // @ts-ignore
              const sh = ServiceHealth.fromJson(namespaces, k, conv, {
                rateInterval: duration,
                hasSidecar: true,
                hasAmbient: false,
              });
              // @ts-ignore
              const nsSvcHealth = ret.get(ns) || {};
              nsSvcHealth[k] = sh;
              ret.set(ns, nsSvcHealth);
            }
          });
        });
      }
      return ret;
    });
  };

  getClustersWorkloadHealth = async (
    namespaces: string,
    duration: DurationInSeconds,
    cluster?: string,
    queryTime?: TimeInSeconds,
  ): Promise<Map<string, NamespaceWorkloadHealth>> => {
    const params: QueryParams<NamespaceHealthQuery & Namespaces> = {
      type: 'workload',
      namespaces: namespaces,
    };
    if (duration) {
      params.rateInterval = `${String(duration)}s`;
    }
    if (queryTime) {
      params.queryTime = String(queryTime);
    }
    if (cluster) {
      params.clusterName = cluster;
    }
    return this.newRequest<NamespaceWorkloadHealth>(
      HTTP_VERBS.GET,
      urls.clustersHealth(),
      params,
      {},
    ).then(response => {
      const ret = new Map<string, NamespaceWorkloadHealth>();
      // @ts-ignore
      const namespaceWorkloadHealth = response.namespaceWorkloadHealth;
      if (namespaceWorkloadHealth) {
        Object.keys(namespaceWorkloadHealth).forEach(ns => {
          if (!ret.get(ns)) {
            ret.set(ns, {});
          }
          // @ts-ignore
          Object.keys(namespaceWorkloadHealth[ns]).forEach(k => {
            // @ts-ignore
            if (namespaceWorkloadHealth[ns][k]) {
              // @ts-ignore
              const conv = namespaceWorkloadHealth[ns][k];
              // @ts-ignore
              const wh = WorkloadHealth.fromJson(namespaces, k, conv, {
                rateInterval: duration,
                hasSidecar: true,
                hasAmbient: false,
              });
              const nsWkHealth = ret.get(ns) || {};
              nsWkHealth[k] = wh;
              ret.set(ns, nsWkHealth);
            }
          });
        });
      }
      return ret;
    });
  };

  getNamespaceTls = async (
    namespace: string,
    cluster?: string,
  ): Promise<TLSStatus> => {
    const queryParams: any = {};
    if (cluster) {
      queryParams.clusterName = cluster;
    }
    return this.newRequest<TLSStatus>(
      HTTP_VERBS.GET,
      urls.namespaceTls(namespace),
      queryParams,
      {},
    ).then(resp => resp);
  };

  getMeshTls = (cluster?: string): Promise<TLSStatus> => {
    const queryParams: any = {};
    if (cluster) {
      queryParams.clusterName = cluster;
    }
    return this.newRequest<TLSStatus>(
      HTTP_VERBS.GET,
      urls.meshTls(),
      queryParams,
      {},
    ).then(resp => resp);
  };

  getOutboundTrafficPolicyMode = (): Promise<OutboundTrafficPolicy> => {
    return this.newRequest<OutboundTrafficPolicy>(
      HTTP_VERBS.GET,
      urls.outboundTrafficPolicyMode(),
      {},
      {},
    ).then(resp => resp);
  };

  getCanaryUpgradeStatus = (): Promise<CanaryUpgradeStatus> => {
    return this.newRequest<CanaryUpgradeStatus>(
      HTTP_VERBS.GET,
      urls.canaryUpgradeStatus(),
      {},
      {},
    ).then(resp => resp);
  };

  getIstiodResourceThresholds = (): Promise<IstiodResourceThresholds> => {
    return this.newRequest<IstiodResourceThresholds>(
      HTTP_VERBS.GET,
      urls.istiodResourceThresholds(),
      {},
      {},
    ).then(resp => resp);
  };

  getConfigValidations = (cluster?: string): Promise<ValidationStatus> => {
    const queryParams: any = {};
    if (cluster) {
      queryParams.clusterName = cluster;
    }
    return this.newRequest<ValidationStatus>(
      HTTP_VERBS.GET,
      urls.configValidations(),
      queryParams,
      {},
    ).then(resp => resp);
  };

  getAllIstioConfigs = (
    objects: string[],
    validate: boolean,
    labelSelector: string,
    workloadSelector: string,
    cluster?: string,
  ): Promise<IstioConfigList> => {
    const params: QueryParams<IstioConfigsMapQuery> = {};
    if (objects && objects.length > 0) {
      params.objects = objects.join(',');
    }
    if (validate) {
      params.validate = validate;
    }
    if (labelSelector) {
      params.labelSelector = labelSelector;
    }
    if (workloadSelector) {
      params.workloadSelector = workloadSelector;
    }
    if (cluster) {
      params.clusterName = cluster;
    }
    return this.newRequest<IstioConfigList>(
      HTTP_VERBS.GET,
      urls.allIstioConfigs(),
      params,
      {},
    );
  };

  getIstioConfigDetail = async (
    namespace: string,
    objectType: string,
    object: string,
    validate: boolean,
    cluster?: string,
  ): Promise<IstioConfigDetails> => {
    const queryParams: QueryParams<IstioConfigDetailsQuery> = {};

    if (cluster) {
      queryParams.clusterName = cluster;
    }

    if (validate) {
      queryParams.validate = true;
      queryParams.help = true;
    }

    return this.newRequest<IstioConfigDetails>(
      HTTP_VERBS.GET,
      urls.istioConfigDetail(namespace, objectType, object),
      queryParams,
      {},
    );
  };

  getNamespaceMetrics = (
    namespace: string,
    params: IstioMetricsOptions,
  ): Promise<Readonly<IstioMetricsMap>> => {
    return this.newRequest<Readonly<IstioMetricsMap>>(
      HTTP_VERBS.GET,
      urls.namespaceMetrics(namespace),
      params,
      {},
    ).then(resp => resp);
  };

  getIstioStatus = (cluster?: string): Promise<ComponentStatus[]> => {
    const queryParams: any = {};
    if (cluster) {
      queryParams.clusterName = cluster;
    }
    return this.newRequest<ComponentStatus[]>(
      HTTP_VERBS.GET,
      urls.istioStatus(),
      queryParams,
      {},
    ).then(resp => resp);
  };

  getIstioCertsInfo = (): Promise<CertsInfo[]> => {
    return this.newRequest<CertsInfo[]>(
      HTTP_VERBS.GET,
      urls.istioCertsInfo(),
      {},
      {},
    ).then(resp => resp);
  };

  setEntity = (entity?: Entity) => {
    this.annotations = entity?.metadata.annotations || {};
  };

  setAnnotation = (key: string, value: string) => {
    this.annotations[key] = value;
  };

  getClustersWorkloads = async (
    namespaces: string,
    params: AppListQuery,
    cluster?: string,
  ): Promise<ClusterWorkloadsResponse> => {
    const queryParams: QueryParams<WorkloadListQuery & Namespaces> = {
      ...params,
      namespaces: namespaces,
    };

    if (cluster) {
      queryParams.clusterName = cluster;
    }

    return this.newRequest<ClusterWorkloadsResponse>(
      HTTP_VERBS.GET,
      urls.clustersWorkloads(),
      queryParams,
      {},
    );
  };

  getWorkload = async (
    namespace: string,
    name: string,
    params: WorkloadQuery,
    cluster?: string,
  ): Promise<Workload> => {
    const queryParams: QueryParams<WorkloadQuery> = { ...params };
    if (cluster) {
      queryParams.clusterName = cluster;
    }
    return this.newRequest<Workload>(
      HTTP_VERBS.GET,
      urls.workload(namespace, name),
      queryParams,
      {},
    ).then(resp => {
      return resp;
    });
  };

  getIstioConfig = async (
    namespace: string,
    objects: string[],
    validate: boolean,
    labelSelector: string,
    workloadSelector: string,
    cluster?: string,
  ): Promise<IstioConfigList> => {
    const params: QueryParams<IstioConfigListQuery> = {};
    if (objects && objects.length > 0) {
      params.objects = objects.join(',');
    }
    if (validate) {
      params.validate = validate;
    }

    if (labelSelector) {
      params.labelSelector = labelSelector;
    }

    if (workloadSelector) {
      params.workloadSelector = workloadSelector;
    }

    if (cluster) {
      params.clusterName = cluster;
    }

    return this.newRequest<IstioConfigList>(
      HTTP_VERBS.GET,
      urls.istioConfig(namespace),
      params,
      {},
    ).then(resp => {
      return resp;
    });
  };

  getPodLogs = async (
    namespace: string,
    name: string,
    container?: string,
    maxLines?: number,
    sinceTime?: number,
    duration?: DurationInSeconds,
    isProxy?: boolean,
    cluster?: string,
  ): Promise<PodLogs> => {
    const params: QueryParams<PodLogsQuery> = {};

    if (container) {
      params.container = container;
    }

    if (sinceTime) {
      params.sinceTime = sinceTime;
    }

    if (maxLines && maxLines > 0) {
      params.maxLines = maxLines;
    }

    if (duration && duration > 0) {
      params.duration = `${duration}s`;
    }

    if (cluster) {
      params.clusterName = cluster;
    }

    params.isProxy = !!isProxy;

    return this.newRequest<PodLogs>(
      HTTP_VERBS.GET,
      urls.podLogs(namespace, name),
      params,
      {},
    ).then(resp => {
      return resp;
    });
  };

  setPodEnvoyProxyLogLevel = async (
    namespace: string,
    name: string,
    level: string,
    cluster?: string,
  ): Promise<void> => {
    const params: QueryParams<LogLevelQuery> = { level: level };

    if (cluster) {
      params.clusterName = cluster;
    }

    return this.newRequest<void>(
      HTTP_VERBS.POST,
      urls.podEnvoyProxyLogging(namespace, name),
      params,
      {},
    ).then(resp => {
      return resp;
    });
  };

  getWorkloadSpans = async (
    namespace: string,
    workload: string,
    params: TracingQuery,
    cluster?: string,
  ): Promise<Span[]> => {
    const queryParams: QueryParams<TracingQuery> = { ...params };

    if (cluster) {
      queryParams.clusterName = cluster;
    }

    return this.newRequest<Span[]>(
      HTTP_VERBS.GET,
      urls.workloadSpans(namespace, workload),
      queryParams,
      {},
    ).then(resp => {
      return resp;
    });
  };

  getClustersServices = async (
    namespaces: string,
    params?: ServiceListQuery,
    cluster?: string,
  ): Promise<ServiceList> => {
    const queryParams: any = {
      ...params,
      namespaces: namespaces,
    };

    if (cluster) {
      queryParams.clusterName = cluster;
    }
    return this.newRequest<ServiceList>(
      HTTP_VERBS.GET,
      urls.clustersServices(),
      queryParams,
      {},
    );
  };

  getServiceDetail = async (
    namespace: string,
    service: string,
    validate: boolean,
    cluster?: string,
    rateInterval?: DurationInSeconds,
  ): Promise<ServiceDetailsInfo> => {
    const params: QueryParams<ServiceDetailsQuery> = {};

    if (validate) {
      params.validate = true;
    }

    if (rateInterval) {
      params.rateInterval = `${rateInterval}s`;
    }

    if (cluster) {
      params.clusterName = cluster;
    }

    return this.newRequest<ServiceDetailsInfo>(
      HTTP_VERBS.GET,
      urls.service(namespace, service),
      params,
      {},
    ).then(r => {
      const info: ServiceDetailsInfo = r;

      if (info.health) {
        // Default rate interval in backend = 600s
        info.health = ServiceHealth.fromJson(namespace, service, info.health, {
          rateInterval: rateInterval ?? 600,
          hasSidecar: info.istioSidecar,
          hasAmbient: info.isAmbient,
        });
      }
      return info;
    });
  };

  getClustersApps = async (
    namespaces: string,
    params: AppListQuery,
    cluster?: string,
  ): Promise<AppList> => {
    const queryParams: QueryParams<AppListQuery & Namespaces> = {
      ...params,
      namespaces: namespaces,
    };

    if (cluster) {
      queryParams.clusterName = cluster;
    }
    return this.newRequest<AppList>(
      HTTP_VERBS.GET,
      urls.clustersApps(),
      queryParams,
      {},
    );
  };

  getApp = async (
    namespace: string,
    app: string,
    params: AppQuery,
    cluster?: string,
  ): Promise<App> => {
    const queryParams: QueryParams<AppQuery> = { ...params };

    if (cluster) {
      queryParams.clusterName = cluster;
    }

    return this.newRequest<App>(
      HTTP_VERBS.GET,
      urls.app(namespace, app),
      queryParams,
      {},
    );
  };

  getWorkloadDashboard = async (
    namespace: string,
    workload: string,
    params: IstioMetricsOptions,
    cluster?: string,
  ): Promise<DashboardModel> => {
    const queryParams: QueryParams<IstioMetricsOptions> = { ...params };

    if (cluster) {
      queryParams.clusterName = cluster;
    }

    return this.newRequest<DashboardModel>(
      HTTP_VERBS.GET,
      urls.workloadDashboard(namespace, workload),
      queryParams,
      {},
      undefined,
      true,
    );
  };

  getServiceDashboard = async (
    namespace: string,
    service: string,
    params: IstioMetricsOptions,
    cluster?: string,
  ): Promise<DashboardModel> => {
    const queryParams: QueryParams<IstioMetricsOptions> = { ...params };

    if (cluster) {
      queryParams.clusterName = cluster;
    }

    return this.newRequest<DashboardModel>(
      HTTP_VERBS.GET,
      urls.serviceDashboard(namespace, service),
      queryParams,
      {},
      undefined,
      true,
    );
  };

  getAppDashboard = async (
    namespace: string,
    app: string,
    params: IstioMetricsOptions,
    cluster?: string,
  ): Promise<DashboardModel> => {
    const queryParams: QueryParams<IstioMetricsOptions> = { ...params };

    if (cluster) {
      queryParams.clusterName = cluster;
    }

    return this.newRequest<DashboardModel>(
      HTTP_VERBS.GET,
      urls.appDashboard(namespace, app),
      queryParams,
      {},
      undefined,
      true,
    );
  };

  getGrafanaInfo = async (): Promise<GrafanaInfo> => {
    return this.newRequest<GrafanaInfo>(HTTP_VERBS.GET, urls.grafana);
  };

  getAppSpans = async (
    namespace: string,
    app: string,
    params: TracingQuery,
    cluster?: string,
  ): Promise<Span[]> => {
    const queryParams: QueryParams<TracingQuery> = { ...params };

    if (cluster) {
      queryParams.clusterName = cluster;
    }

    return this.newRequest<Span[]>(
      HTTP_VERBS.GET,
      urls.appSpans(namespace, app),
      queryParams,
      {},
    );
  };

  getServiceSpans = async (
    namespace: string,
    service: string,
    params: TracingQuery,
    cluster?: string,
  ): Promise<Span[]> => {
    const queryParams: QueryParams<TracingQuery> = { ...params };

    if (cluster) {
      queryParams.clusterName = cluster;
    }

    return this.newRequest<Span[]>(
      HTTP_VERBS.GET,
      urls.serviceSpans(namespace, service),
      queryParams,
      {},
    );
  };

  getCrippledFeatures = async (): Promise<KialiCrippledFeatures> => {
    return this.newRequest<KialiCrippledFeatures>(
      HTTP_VERBS.GET,
      urls.crippledFeatures,
    );
  };

  getGraphElements = async (
    params: GraphElementsQuery,
  ): Promise<GraphDefinition> => {
    return this.newRequest<GraphDefinition>(
      HTTP_VERBS.GET,
      urls.namespacesGraphElements,
      params,
      {},
    );
  };
}

export const getErrorString = (error: AxiosError): string => {
  if (error && error.response) {
    // @ts-expect-error
    if (error.response.data && error.response.data.error) {
      // @ts-expect-error
      return error.response.data.error;
    }
    if (error.response.statusText) {
      let errorString = error.response.statusText;
      if (error.response.status === 401) {
        errorString += ': Has your session expired? Try logging in again.';
      }
      return errorString;
    }
  }
  return '';
};

export const getErrorDetail = (error: AxiosError): string => {
  if (error && error.response) {
    // @ts-expect-error
    if (error.response.data && error.response.data.detail) {
      // @ts-expect-error
      return error.response.data.detail;
    }
  }
  return '';
};
