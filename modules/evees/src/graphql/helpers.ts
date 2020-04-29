import { ApolloClient, gql } from "apollo-boost";

import { CASStore, loadEntity } from "@uprtcl/multiplatform";
import { Signed, Entity, PatternRecognizer } from "@uprtcl/cortex";
import { Updatable, Permissions, Authority } from "@uprtcl/access-control";

import { CREATE_ENTITY, CREATE_PERSPECTIVE, UPDATE_HEAD } from "./queries";
import { EveesRemote } from "../services/evees.remote";
import { Commit, Perspective } from '../types';
import { signObject } from "../utils/signed";

export interface CreateCommit {
  dataId: string, 
  parentsIds?: string[], 
  creatorsIds?: string[], 
  message?: string, 
  timestamp?: number
}

export interface CreatePerspective {
  headId?: string,
  parentId?: string
  context?: string,
  name?: string, 
  canWrite?: string
  timestamp?: number,
  creatorId?: string
}

export class EveesHelpers {
  static async getPerspectiveHeadId(client: ApolloClient<any>, perspectiveId: string): Promise<string> {
    const result = await client.query({
      query: gql`
        {
          entity(ref: "${perspectiveId}") {
            id
            ... on Perspective {
              head {
                id
              }
            }
          }
        }`
    });
    return result.data.entity.head.id;
  }

  static async getPerspectiveContext(client: ApolloClient<any>, perspectiveId: string): Promise<string> {
    const result = await client.query({
      query: gql`
        {
          entity(ref: "${perspectiveId}") {
            id
            ... on Perspective {
              context {
                id
              }
            }
          }
        }`
    });
    return result.data.entity.context.id;
  }
  
  static async getPerspectiveAuthority(client: ApolloClient<any>, perspectiveId: string): Promise<string> {
    const perspective = await loadEntity<Signed<Perspective>>(client, perspectiveId);
    if (!perspective) throw new Error('perspective not found');
    return perspective.object.payload.authority;
  }
  
  static async getPerspectiveDataId (client: ApolloClient<any>, perspectiveId: string): Promise<string>  {
    const headId = await this.getPerspectiveHeadId(client, perspectiveId);
    return this.getCommitDataId(client, headId);
  }
  
  static async getPerspectiveData(client: ApolloClient<any>, perspectiveId: string): Promise<Entity<any>> {
    const headId = await this.getPerspectiveHeadId(client, perspectiveId);
    return this.getCommitData(client, headId);
  }
  
  static async getCommitData(client: ApolloClient<any>, commitId: string): Promise<Entity<any>> {
    const result = await client.query({
      query: gql`
      {
        entity(ref: "${commitId}") {
          id 
          ... on Commit {
            data {
              id
            }
          }
        }
      }`
    });
    const dataId = result.data.entity.data.id;
    const data = await loadEntity<any>(client, dataId);
    if (!data) throw new Error('data not found');
    return data;
  }
  
  static async getCommitDataId(client: ApolloClient<any>, commitId: string): Promise<string> {
    const commit = await loadEntity<Signed<Commit>>(client, commitId);
    if (!commit) throw new Error('commit not found');
    return commit.object.payload.dataId;
  }

  static async getAccessControl(client: ApolloClient<any>, ref: string): Promise<{ canWrite: boolean, permissions: any }> {
    const result = await client.query({
      query: gql`{
        entity(ref: "${ref}") {
          id
          _context {
            patterns {
              accessControl {
                canWrite
                permissions
              }
            }
          }
        }
      }`
    });

    return {
      canWrite: result.data.entity._context.patterns.accessControl.canWrite,
      permissions: result.data.entity._context.patterns.accessControl.permissions
    }
  }
  
  
  // Creators
  static async createEntity(client: ApolloClient<any>, store: CASStore, object: any) {
    const create = await client.mutate({
      mutation: CREATE_ENTITY,
      variables: {
        object: object,
        casID: store.casID
      }
    });
  
    return create.data.createEntity.id;
  }

  static async createCommit(
    client: ApolloClient<any>, 
    store: CASStore,
    commit: CreateCommit) {
  
    const message = commit.message !== undefined ? commit.message : '';
    const timestamp = commit.timestamp !== undefined ? commit.timestamp : Date.now();
    const creatorsIds = commit.creatorsIds !== undefined ? commit.creatorsIds : [];
    const parentsIds = commit.parentsIds !== undefined ? commit.parentsIds : [];
    
    const commitData: Commit = {
      creatorsIds: creatorsIds,
      dataId: commit.dataId,
      message: message,
      timestamp: timestamp,
      parentsIds: parentsIds
    };
  
    const commitEntity = signObject(commitData);
  
    const create = await client.mutate({
      mutation: CREATE_ENTITY,
      variables: {
        object: commitEntity,
        casID: store.casID
      }
    });
  
    return create.data.createEntity.id;
  }
  
  static async createPerspective(
    client: ApolloClient<any>,
    remote: EveesRemote, 
    perspective: CreatePerspective) {
  
    const createPerspective = await client.mutate({
      mutation: CREATE_PERSPECTIVE,
      variables: {
        authority: remote.authority,
        casID: remote.casID,
        ...perspective
      }
    });
  
    return createPerspective.data.createPerspective.id;
  }
  
  static async updateHead(
    client: ApolloClient<any>,
    perspectiveId: string,
    headId: string) {
    
    await client.mutate({
      mutation: UPDATE_HEAD,
      variables: {
        perspectiveId,
        headId
      }
    });
  
    return headId;
  }
  
}
