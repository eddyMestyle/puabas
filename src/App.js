import React, { useState, useEffect } from 'react';
import liff from '@line/liff';
import axios from 'axios';
import { Box, Button, Card, CardActions, CardContent, Typography, CircularProgress, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const colors = {
  primary: '#15023F',
  secondary: '#680404',
  white: '#FFFFFF',
  black: '#000000',
};

const NeumorphicBox = styled(Paper)(({ theme }) => ({
  background: colors.white,
  borderRadius: '20px',
  boxShadow: `8px 8px 16px ${colors.black}20, -8px -8px 16px ${colors.white}`,
  padding: '20px',
  textAlign: 'center',
}));

const proxyUrl = 'https://serverpuabas-1.onrender.com'; // Replace with actual proxy or ngrok URL

const getRandomScore = () => {
  const totalWeight = 911111010;
  const randomInt = Math.floor(Math.random() * totalWeight) + 1;

  if (randomInt <= 10) return Math.floor(Math.random() * (10000 - 5001 + 1)) + 5001;
  if (randomInt <= 1010) return Math.floor(Math.random() * (4999 - 3001 + 1)) + 3001;
  if (randomInt <= 11010) return Math.floor(Math.random() * (3000 - 1001 + 1)) + 1001;
  if (randomInt <= 111010) return Math.floor(Math.random() * (1000 - 500 + 1)) + 500;
  if (randomInt <= 1111010) return Math.floor(Math.random() * (499 - 300 + 1)) + 300;
  if (randomInt <= 11111110) return Math.floor(Math.random() * (299 - 100 + 1)) + 100;
  if (randomInt <= 61111110) return Math.floor(Math.random() * (99 - 50 + 1)) + 50;
  if (randomInt <= 211111110) return Math.floor(Math.random() * (49 - 21 + 1)) + 21;
  return Math.floor(Math.random() * (20 - 1 + 1)) + 1;
};


const App = () => {
  const [score, setScore] = useState(null); // ประกาศตัวแปร score
  const [isAnimating, setIsAnimating] = useState(false); // ประกาศตัวแปร isAnimating
  const [totalBonus, setTotalBonus] = useState(0); // ประกาศตัวแปร totalBonus
  const [userProfile, setUserProfile] = useState(null);
  const [remainingChances, setRemainingChances] = useState(0); // ค่าเริ่มต้นคือ 0
  const [isLoading, setIsLoading] = useState(true); // ค่าเริ่มต้นขณะโหลดข้อมูล

  // ฟังก์ชันบันทึกข้อมูลผู้ใช้ใหม่
  const storeUserProfile = async (profile) => {
    try {
      const response = await axios.post(`${proxyUrl}/items/user`, {
        line_user_id: profile.userId,
        display_name: profile.displayName,
        email: profile.email || '',
        profile_picture_url: profile.pictureUrl,
        random_draws_available: 5, // ค่าเริ่มต้น
        total_bonus: 0 // ค่าเริ่มต้น
      });
      console.log('User profile stored successfully:', response.data);
    } catch (err) {
      console.error('Error storing user profile:', err);
    }
  };

  // ฟังก์ชันสุ่มคะแนน (Handle randomization)
  const handleRandomize = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      const randomScore = Math.floor(Math.random() * 100) + 1; // สุ่มคะแนนระหว่าง 1-100
      setScore(randomScore);
      setIsAnimating(false);
    }
  };

  // ฟังก์ชันเคลมโบนัส (Handle bonus claim)
  const handleClaimBonus = () => {
    setTotalBonus(0); // รีเซ็ต totalBonus หลังจากเคลมแล้ว
    alert(`คุณเคลมคะแนนโบนัสทั้งหมด ${totalBonus} Points`);
  };

  // ฟังก์ชันเพิ่มสิทธิ์ในการสุ่ม (Handle add chances)
  const handleAddChances = () => {
    setRemainingChances(remainingChances + 1); // เพิ่มสิทธิ์ในการสุ่ม
  };

  
// ฟังก์ชันดึงข้อมูลสิทธิ์ในการสุ่มจาก Random Draws Available
const fetchRemainingDraws = async (lineUserId) => {
  try {
    const response = await axios.post(`${proxyUrl}/items/user/?filter[line_user_id][_eq]=${lineUserId}`);
    console.log('Line User ID:', lineUserId);

    if (response.data) {
      // ใช้ Random Draws Available แทน Draw Status
      setRemainingChances(response.data.random_draws_available || 0); // ดึง Random Draws Available
      setTotalBonus(response.data.total_bonus || 0); // ดึงคะแนนสะสมทั้งหมด
    } else {
      console.error('No data found for user');
    }
  } catch (err) {
    console.error('Error fetching draw status:', err);
  }
};

  // ฟังก์ชันเช็คว่าผู้ใช้มีอยู่ในระบบหรือไม่
  const checkUserExists = async (lineUserId) => {
    try {
      const response = await axios.post(`${proxyUrl}/items/user/?filter[line_user_id][_eq]=${lineUserId}`);
      if (response.data) {
        console.log('User exists:', response.data);
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.error('Error checking user existence:', err);
      return false;
    }
  };

  // ฟังก์ชันหลักในการดึงข้อมูลผู้ใช้
  const fetchUserProfile = async () => {
    try {
      const profile = await liff.getProfile();
      setUserProfile(profile);

      // เช็คว่ามีผู้ใช้ในระบบหรือไม่
      const userExists = await checkUserExists(profile.userId);
      if (!userExists) {
        console.log('User does not exist, creating new user');
        await storeUserProfile(profile); // ถ้าไม่มีให้บันทึกผู้ใช้ใหม่
      }

      // หลังจากนั้นดึงข้อมูลสิทธิ์ในการสุ่มจาก Random Draws Available
      await fetchRemainingDraws(profile.userId);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  // ฟังก์ชัน LIFF initialization
  useEffect(() => {
    const initializeLiff = async () => {
      try {
        await liff.init({ liffId: '2006313023-25YJYLoe', withLoginOnExternalBrowser: true });
        if (!liff.isLoggedIn()) {
          liff.login();
        } else {
          await fetchUserProfile(); // ดึงข้อมูลผู้ใช้หลังจาก LIFF init
        }
      } catch (err) {
        console.error('LIFF Initialization failed', err);
      }
    };

    initializeLiff();
  }, []);

  
  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <p>Remaining Chances: {remainingChances}</p>
          <p>User: {userProfile ? userProfile.displayName : 'No user data'}</p>
          <button onClick={handleRandomize}>สุ่มคะแนน</button>
          <button onClick={handleClaimBonus} disabled={totalBonus === 0}>เคลมโบนัส</button>
          <button onClick={handleAddChances}>เพิ่มสิทธิ์ในการสุ่ม</button>
        </div>
      )}
    </div>
  );
};

export default App;