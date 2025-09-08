import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, images } from '../constants';
import Button from './Button';

const { width, height } = Dimensions.get('window');

const EventModal = ({ visible, onClose, onJoinEvent, eventData }) => {
  const defaultEvent = {
    title: "",
    subtitle: "",
    description: "SHALOM A TOUS LES ADORATEURS, NOUS SOMMES EN MARCHE VERS LE STADE DE L'UNIVERSITE DE COCODY POUR VIVRE LA 9ème EDITION DU RASSEMBLEMENT INTERNATIONAL DES ADORATEURS (RIA 2025) LE DIMANCHE 23 NOVEMBRE 2025",
    date: "23 Nov 2025",
    time: "16h00 - 00h00",
    location: "Stade de l'université de cocody, Abidjan",
    image: images.eventBanner,
  };

  const event = eventData || defaultEvent;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header avec image */}
          <ImageBackground
            source={event.image}
            style={styles.headerImage}
            imageStyle={styles.headerImageStyle}
          >
            <View style={styles.headerOverlay}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <MaterialIcons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventSubtitle}>{event.subtitle}</Text>
              </View>
            </View>
          </ImageBackground>

          {/* Contenu */}
          <View style={styles.content}>
            <Text style={styles.description}>{event.description}</Text>
            
            <View style={styles.eventDetails}>
              <View style={styles.detailRow}>
                <MaterialIcons name="event" size={20} color={COLORS.primary} />
                <Text style={styles.detailText}>{event.date}</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="access-time" size={20} color={COLORS.primary} />
                <Text style={styles.detailText}>{event.time}</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="location-on" size={20} color={COLORS.primary} />
                <Text style={styles.detailText}>{event.location}</Text>
              </View>
            </View>

            {/* Boutons d'action */}
            <View style={styles.buttonContainer}>
              <Button
                title="Participer"
                filled
                style={styles.joinButton}
                onPress={onJoinEvent}
              />
              <TouchableOpacity style={styles.laterButton} onPress={onClose}>
                <Text style={styles.laterButtonText}>Plus tard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: height * 0.8,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  headerImage: {
    height: 200,
    width: '100%',
  },
  headerImageStyle: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
    padding: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  eventTitle: {
    ...FONTS.h2,
    color: COLORS.white,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  eventSubtitle: {
    ...FONTS.h4,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  description: {
    ...FONTS.body3,
    color: COLORS.black,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  eventDetails: {
    marginBottom: 25,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  detailText: {
    ...FONTS.body3,
    color: COLORS.black,
    marginLeft: 12,
    flex: 1,
  },
  buttonContainer: {
    gap: 12,
  },
  joinButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  laterButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  laterButtonText: {
    ...FONTS.body3,
    color: COLORS.gray,
    fontWeight: '500',
  },
});

export default EventModal;