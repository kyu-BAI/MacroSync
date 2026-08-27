import { StyleSheet } from 'react-native';

const logoGreen = '#10B981';

export const styles = StyleSheet.create({
  floatingChatbotContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
    width: 56,
    height: 56,
  },
  chatbotFloatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: logoGreen,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
});
