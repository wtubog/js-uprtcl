import gql from 'graphql-tag';

export const CREATE_TEXT_NODE = gql`
  mutation CreateTextNode($content: TextNodeInput!, $source: ID) {
    createTextNode(content: $content, source: $source) {
      id
    }
  }
`;
