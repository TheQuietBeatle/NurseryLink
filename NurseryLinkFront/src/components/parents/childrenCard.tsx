import React from 'react';
import styled from 'styled-components';
import type { Child } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

type CardProps = {
  child: Child;
};

const Card = ({ child }: CardProps) => {
  const navigate = useNavigate()
  return (
    <StyledWrapper onClick={() => navigate(`/parent/child/child_dashboard`, {state: {child}})}>
      <div className="card">
        <span className="name">{child.name}</span>
        <span className="age">{calculateAge(child.date_of_birth)} years old</span>
      </div>
    </StyledWrapper>
    
  );
  
}

const StyledWrapper = styled.div`
  .card {
    margin: 15px;
    box-sizing: border-box;
    width: 250px;
    height: 250px;
    background: rgba(217, 217, 217, 0.58);
    border: 1px solid white;
    box-shadow: 12px 17px 51px rgba(0, 0, 0, 0.22);
    backdrop-filter: blur(6px);
    border-radius: 17px;
    text-align: center;
    cursor: pointer;
    transition: all 0.5s;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    user-select: none;
    font-weight: bolder;
    color: black;
  }

  .card .name {
    font-size: 1.25rem;
  }

  .card .age {
    font-size: 0.875rem;
    font-weight: normal;
    color: #333;
  }

  .card:hover {
    border: 1px solid black;
    transform: scale(1.05);
  }

  .card:active {
    transform: scale(0.95) rotateZ(1.7deg);
  }`;

export default Card;
